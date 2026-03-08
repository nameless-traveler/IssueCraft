/**
 * eventParser.js
 * Extracts structured issue data from the GitHub Actions event payload.
 * Reads the JSON file pointed to by GITHUB_EVENT_PATH.
 */

const fs = require('fs');
const config = require('../utils/config');
const logger = require('../utils/logger');

/**
 * Parses the GitHub event payload and returns a clean issue object.
 *
 * @returns {{
 *   title: string,
 *   body: string,
 *   number: number,
 *   repoOwner: string,
 *   repoName: string,
 *   htmlUrl: string
 * }}
 * @throws {Error} if the event payload is missing or malformed.
 */
function parseEvent() {
  const eventPath = config.github.eventPath;

  if (!eventPath) {
    throw new Error(
      'GITHUB_EVENT_PATH is not set. Are you running inside a GitHub Actions runner?'
    );
  }

  let payload;
  try {
    const raw = fs.readFileSync(eventPath, 'utf8');
    payload = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to read or parse GitHub event payload: ${err.message}`);
  }

  const issue = payload.issue;
  if (!issue) {
    throw new Error('Event payload does not contain an "issue" field. Is this an issues event?');
  }

  const repository = payload.repository;
  if (!repository) {
    throw new Error('Event payload does not contain a "repository" field.');
  }

  const issueData = {
    title:     (issue.title   || '').trim(),
    body:      (issue.body    || '').trim(),
    number:    issue.number,
    repoOwner: repository.owner?.login || '',
    repoName:  repository.name         || '',
    htmlUrl:   issue.html_url          || '',
  };

  logger.issueReceived(issueData.number, issueData.title);

  return issueData;
}

module.exports = { parseEvent };
