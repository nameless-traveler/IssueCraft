/**
 * responseParser.js
 * Parses and validates the raw text returned by the OpenAI API.
 * Guarantees a consistent, safe object for downstream modules.
 */

const logger = require('../utils/logger');

const REQUIRED_ISSUE_TYPES = [
  'bug', 'feature_request', 'improvement',
  'ui_ux', 'documentation', 'performance', 'other',
];

const REQUIRED_ENHANCED_FIELDS = [
  'title', 'summary', 'steps_to_reproduce',
  'observed_behavior', 'expected_behavior',
];

/**
 * Parses the raw AI response string into a validated JS object.
 *
 * @param {string} rawResponse - The raw string returned by the LLM.
 * @returns {{
 *   issue_type: string,
 *   enhanced_issue: {
 *     title: string,
 *     summary: string,
 *     steps_to_reproduce: string,
 *     observed_behavior: string,
 *     expected_behavior: string,
 *   },
 *   missing_information: string[],
 *   suggested_labels: string[],
 * }}
 * @throws {Error} if the response cannot be parsed or fails critical validation.
 */
function parseResponse(rawResponse) {
  // ── 1. Strip any accidental markdown code fences ─────────────────────────
  const cleaned = rawResponse
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  // ── 2. Parse JSON ─────────────────────────────────────────────────────────
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`AI response is not valid JSON: ${err.message}\n\nRaw response:\n${rawResponse}`);
  }

  // ── 3. Validate top-level structure ───────────────────────────────────────
  const topLevelKeys = ['issue_type', 'enhanced_issue', 'missing_information', 'suggested_labels'];
  for (const key of topLevelKeys) {
    if (!(key in parsed)) {
      throw new Error(`AI response is missing required top-level field: "${key}"`);
    }
  }

  // ── 4. Validate issue_type ────────────────────────────────────────────────
  const issueType = String(parsed.issue_type || '').toLowerCase();
  if (!REQUIRED_ISSUE_TYPES.includes(issueType)) {
    logger.warn('Unrecognised issue_type, defaulting to "other"', { received: issueType });
    parsed.issue_type = 'other';
  } else {
    parsed.issue_type = issueType;
  }

  // ── 5. Validate enhanced_issue sub-fields ─────────────────────────────────
  if (typeof parsed.enhanced_issue !== 'object' || parsed.enhanced_issue === null) {
    throw new Error('"enhanced_issue" must be an object.');
  }

  for (const field of REQUIRED_ENHANCED_FIELDS) {
    if (!(field in parsed.enhanced_issue)) {
      logger.warn(`enhanced_issue is missing field "${field}", defaulting to "Not specified"`);
      parsed.enhanced_issue[field] = 'Not specified';
    } else {
      // Coerce to string and trim
      parsed.enhanced_issue[field] = String(parsed.enhanced_issue[field] || 'Not specified').trim();
    }
  }

  // ── 6. Validate arrays ────────────────────────────────────────────────────
  if (!Array.isArray(parsed.missing_information)) {
    logger.warn('"missing_information" is not an array, defaulting to []');
    parsed.missing_information = [];
  } else {
    parsed.missing_information = parsed.missing_information
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim());
  }

  if (!Array.isArray(parsed.suggested_labels)) {
    logger.warn('"suggested_labels" is not an array, defaulting to []');
    parsed.suggested_labels = [];
  } else {
    parsed.suggested_labels = parsed.suggested_labels
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim().toLowerCase().replace(/\s+/g, '-'));
  }

  logger.responseReceived(parsed.issue_type);

  return parsed;
}

module.exports = { parseResponse };
