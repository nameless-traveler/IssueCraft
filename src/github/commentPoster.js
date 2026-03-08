/**
 * commentPoster.js
 * Posts the AI-enhanced issue as a bot comment via the GitHub REST API.
 */

const https = require('https');
const config = require('../utils/config');
const logger = require('../utils/logger');

/**
 * Posts a markdown comment on a GitHub issue.
 *
 * @param {string} repoOwner   - GitHub repository owner (org or user)
 * @param {string} repoName    - Repository name
 * @param {number} issueNumber - Issue number to comment on
 * @param {string} body        - Markdown content for the comment
 * @returns {Promise<{id: number, html_url: string}>}
 */
async function postComment(repoOwner, repoName, issueNumber, body) {
  const token = config.github.token;

  if (!token) {
    throw new Error('GITHUB_TOKEN is not set. Cannot post comment without authentication.');
  }

  const path = `/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments`;
  const payload = JSON.stringify({ body });

  logger.debug('Posting comment to GitHub', { path, issueNumber });

  const responseData = await makeRequest(path, payload, token);

  logger.commentPosted(issueNumber, responseData.html_url);

  return {
    id:       responseData.id,
    html_url: responseData.html_url,
  };
}

/**
 * Low-level HTTPS POST to api.github.com.
 * @private
 */
function makeRequest(path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method:   'POST',
      headers: {
        'Content-Type':  'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${token}`,
        'Accept':         'application/vnd.github+json',
        'User-Agent':     'ai-issue-enhancer/1.0.0',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Failed to parse GitHub API response: ${data}`));
          }
        } else {
          reject(
            new Error(
              `GitHub API responded with status ${res.statusCode}: ${data}`
            )
          );
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { postComment };
