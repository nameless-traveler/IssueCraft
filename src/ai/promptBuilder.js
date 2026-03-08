/**
 * promptBuilder.js
 * Loads the prompt template and injects live issue data into it.
 */

const fs   = require('fs');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');

/**
 * Builds the final prompt string by injecting issue data into the template.
 *
 * @param {{ title: string, body: string }} issueData
 * @returns {string} The ready-to-send prompt.
 * @throws {Error} if the template file cannot be read.
 */
function buildPrompt(issueData) {
  // Resolve template path relative to the project root (two levels up from src/ai/)
  const projectRoot   = path.resolve(__dirname, '..', '..');
  const templatePath  = path.join(projectRoot, config.prompt.templatePath);

  let template;
  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    throw new Error(`Could not load prompt template from "${templatePath}": ${err.message}`);
  }

  // Sanitise inputs — prevent accidental placeholder collision
  const title = (issueData.title || 'No title provided').trim();
  const body  = (issueData.body  || 'No description provided').trim();

  const prompt = template
    .replace('{issue_title}', title)
    .replace('{issue_body}',  body);

  logger.promptGenerated(prompt.length);
  logger.debug('Prompt preview (first 300 chars)', { preview: prompt.slice(0, 300) });

  return prompt;
}

module.exports = { buildPrompt };
