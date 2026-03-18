const test = require('node:test');
const assert = require('node:assert/strict');

const { parseResponse } = require('../src/ai/responseParser');

function buildRaw(overrides = {}) {
  return JSON.stringify({
    issue_type: 'bug',
    priority: 'high',
    priority_reason: 'Blocks login flow for active users',
    severity: 'critical',
    confidence: 'high',
    enhanced_issue: {
      title: 'Login button unresponsive',
      summary: 'Login button does not respond when clicked.',
      steps_to_reproduce: 'Not specified',
      observed_behavior: 'Button click has no effect.',
      expected_behavior: 'Login process should start.',
    },
    missing_information: [],
    suggested_labels: [],
    ...overrides,
  });
}

test('preserves bug label with structured labels even when labels are capped at 5', () => {
  const parsed = parseResponse(
    buildRaw({
      suggested_labels: ['login', 'needs-info', 'frontend', 'urgent', 'critical', 'auth'],
    })
  );

  assert.deepEqual(parsed.suggested_labels, [
    'bug',
    'severity-critical',
    'priority-high',
    'needs-info',
    'login',
  ]);
});

test('normalises question-style missing information into noun-style phrases', () => {
  const parsed = parseResponse(
    buildRaw({
      missing_information: [
        'Are credentials entered before clicking?',
        'Any error messages displayed?',
      ],
    })
  );

  assert.deepEqual(parsed.missing_information, [
    'credentials entered before clicking',
    'error messages displayed',
  ]);
});
