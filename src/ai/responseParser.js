/**
 * responseParser.js
 * Parses and validates the raw text returned by the LLM.
 * Guarantees a consistent, safe object for downstream modules.
 */

const logger = require('../utils/logger');

const REQUIRED_ISSUE_TYPES = [
  'bug', 'feature_request', 'improvement',
  'ui_ux', 'documentation', 'performance', 'other',
];

const TEMPLATE_FIELDS = {
  bug: ['title', 'summary', 'steps_to_reproduce', 'observed_behavior', 'expected_behavior'],
  feature_request: ['title', 'summary', 'proposed_feature', 'expected_outcome', 'expected_impact'],
  documentation: ['title', 'summary', 'affected_docs', 'suggested_change'],
  performance: ['title', 'summary', 'current_performance', 'expected_performance', 'environment'],
  improvement: ['title', 'summary', 'current_limitation', 'proposed_improvement', 'expected_outcome'],
  ui_ux: ['title', 'summary', 'current_experience', 'expected_experience', 'user_impact', 'design_reference'],
  other: ['title', 'summary', 'observed_behavior', 'expected_behavior'],
};

const TITLE_PREFIX = {
  bug: 'Bug',
  feature_request: 'Feature',
  documentation: 'Docs',
  performance: 'Performance',
  improvement: 'Improvement',
  ui_ux: 'UI/UX',
  other: 'Other',
};

const SUMMARY_MAX_WORDS = 40;
const MISSING_INFO_MAX_ITEMS = 8;
const LABELS_MAX_ITEMS = 5;
const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'];
const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low'];

/**
 * Parses the raw AI response string into a validated JS object.
 *
 * @param {string} rawResponse - The raw string returned by the LLM.
 * @returns {{
 *   issue_type: string,
 *   priority: string,
 *   severity: string,
 *   enhanced_issue: Record<string, string>,
 *   missing_information: string[],
 *   suggested_labels: string[],
 * }}
 * @throws {Error} if the response cannot be parsed or fails critical validation.
 */
function parseResponse(rawResponse) {
  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI response is not valid JSON: ${err.message}\n\nRaw response:\n${rawResponse}`);
  }

  validateTopLevel(parsed);
  parsed.issue_type = normaliseIssueType(parsed.issue_type);
  parsed.severity = normaliseSeverity(parsed.severity);
  parsed.priority = normalisePriority(parsed.priority, parsed.severity);
  parsed.enhanced_issue = normaliseEnhancedIssue(parsed.issue_type, parsed.enhanced_issue);
  parsed.missing_information = normaliseMissingInfo(parsed.missing_information);
  parsed.suggested_labels = normaliseLabels(parsed.suggested_labels, parsed.priority);

  logger.responseReceived(parsed.issue_type);
  return parsed;
}

function validateTopLevel(parsed) {
  const topLevelKeys = ['issue_type', 'priority', 'severity', 'enhanced_issue', 'missing_information', 'suggested_labels'];
  for (const key of topLevelKeys) {
    if (!(key in parsed)) {
      throw new Error(`AI response is missing required top-level field: "${key}"`);
    }
  }
}

function normaliseSeverity(severityRaw) {
  const severity = String(severityRaw || '').trim().toLowerCase();
  if (!SEVERITY_LEVELS.includes(severity)) {
    logger.warn('Unrecognised severity, defaulting to "medium"', { received: severity });
    return 'medium';
  }
  return severity;
}

function normalisePriority(priorityRaw, severity) {
  const priority = String(priorityRaw || '').trim().toLowerCase();
  if (!PRIORITY_LEVELS.includes(priority)) {
    logger.warn('Unrecognised priority, deriving from severity', { received: priority, severity });
    return severity;
  }
  return priority;
}

function normaliseIssueType(issueTypeRaw) {
  const issueType = String(issueTypeRaw || '').trim().toLowerCase();
  if (!REQUIRED_ISSUE_TYPES.includes(issueType)) {
    logger.warn('Unrecognised issue_type, defaulting to "other"', { received: issueType });
    return 'other';
  }
  return issueType;
}

function normaliseEnhancedIssue(issueType, enhancedIssueRaw) {
  if (typeof enhancedIssueRaw !== 'object' || enhancedIssueRaw === null) {
    throw new Error('"enhanced_issue" must be an object.');
  }

  const requiredFields = TEMPLATE_FIELDS[issueType] || TEMPLATE_FIELDS.other;
  const result = {};

  for (const field of requiredFields) {
    const isUiUxDesignReference = issueType === 'ui_ux' && field === 'design_reference';
    const defaultValue = isUiUxDesignReference ? 'none' : 'Not specified';

    if (!(field in enhancedIssueRaw)) {
      logger.warn(`enhanced_issue is missing field "${field}", defaulting to "${defaultValue}"`);
      result[field] = defaultValue;
    } else {
      result[field] = String(enhancedIssueRaw[field] || defaultValue).trim() || defaultValue;
    }
  }

  result.title = ensureTitlePrefix(result.title, issueType);
  result.summary = ensureSummaryLength(result.summary, SUMMARY_MAX_WORDS);

  return result;
}

function ensureTitlePrefix(title, issueType) {
  const safeTitle = (title || '').trim() || 'Not specified';
  const prefix = TITLE_PREFIX[issueType] || TITLE_PREFIX.other;
  const expectedPrefix = `${prefix}:`;

  if (/^[a-z0-9/_ -]+:/i.test(safeTitle)) {
    return safeTitle;
  }

  return `${expectedPrefix} ${safeTitle}`;
}

function ensureSummaryLength(summary, maxWords) {
  const safeSummary = (summary || '').trim() || 'Not specified';
  const words = safeSummary.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return safeSummary;

  logger.warn('Summary exceeds maximum word count, truncating', {
    original_words: words.length,
    max_words: maxWords,
  });

  return words.slice(0, maxWords).join(' ');
}

function normaliseMissingInfo(missingInfoRaw) {
  if (!Array.isArray(missingInfoRaw)) {
    logger.warn('"missing_information" is not an array, defaulting to []');
    return [];
  }

  const deduped = dedupeStrings(
    missingInfoRaw
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  );

  return deduped.slice(0, MISSING_INFO_MAX_ITEMS);
}

function normaliseLabels(labelsRaw, priority) {
  if (!Array.isArray(labelsRaw)) {
    logger.warn('"suggested_labels" is not an array, defaulting to []');
    return [`priority-${priority}`];
  }

  const normalized = labelsRaw
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase().replace(/\s+/g, '-'))
    .map((item) => item.replace(/[^a-z0-9-]/g, ''))
    .filter(Boolean);

  normalized.push(`priority-${priority}`);

  const deduped = dedupeStrings(
    normalized
  );

  return deduped.slice(0, LABELS_MAX_ITEMS);
}

function dedupeStrings(items) {
  return [...new Set(items)];
}

module.exports = { parseResponse };
