const test = require('node:test');
const assert = require('node:assert/strict');

const { formatComment } = require('../src/formatter/markdownFormatter');

function buildParsed(overrides = {}) {
  return {
    issue_type: 'bug',
    priority: 'high',
    priority_reason: 'Blocks core login flow',
    severity: 'critical',
    confidence: 'high',
    enhanced_issue: {
      title: 'Bug: Login button unresponsive',
      summary: 'Login button does not respond to click.',
      steps_to_reproduce: 'Not specified',
      observed_behavior: 'Button click has no effect.',
      expected_behavior: 'Login process should start.',
    },
    missing_information: [],
    suggested_labels: ['bug', 'severity-critical', 'priority-high'],
    ...overrides,
  };
}

test('formats 2+ actionable steps into numbered markdown list', () => {
  const parsed = buildParsed({
    enhanced_issue: {
      title: 'Bug: Login button unresponsive',
      summary: 'Login button does not respond to click.',
      steps_to_reproduce: 'Navigate to login page, click login button',
      observed_behavior: 'Button click has no effect.',
      expected_behavior: 'Login process should start.',
    },
  });

  const output = formatComment(parsed);

  assert.match(output, /1\. Navigate to login page/);
  assert.match(output, /2\. click login button/i);
});

test('keeps steps as plain text when fewer than 2 actionable steps are present', () => {
  const parsed = buildParsed({
    enhanced_issue: {
      title: 'Bug: Login button unresponsive',
      summary: 'Login button does not respond to click.',
      steps_to_reproduce: 'Login button unresponsive after page loads',
      observed_behavior: 'Button click has no effect.',
      expected_behavior: 'Login process should start.',
    },
  });

  const output = formatComment(parsed);

  assert.match(output, /Login button unresponsive after page loads/);
  assert.doesNotMatch(output, /1\. Login button unresponsive after page loads/);
});
