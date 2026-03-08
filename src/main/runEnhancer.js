/**
 * runEnhancer.js
 * Main orchestrator — drives the entire AI Issue Enhancer pipeline.
 *
 * Pipeline:
 *   GitHub Event → eventParser → promptBuilder → openaiClient
 *               → responseParser → markdownFormatter → commentPoster
 */

const { parseEvent }    = require('../github/eventParser');
const { postComment }   = require('../github/commentPoster');
const { buildPrompt }   = require('../ai/promptBuilder');
const { callOpenAI }    = require('../ai/openaiClient');
const { parseResponse } = require('../ai/responseParser');
const { formatComment } = require('../formatter/markdownFormatter');
const logger            = require('../utils/logger');

async function run() {
  logger.info('AI Issue Enhancer pipeline starting…');

  // ── Step 1: Parse the GitHub event ───────────────────────────────────────
  let issueData;
  try {
    issueData = parseEvent();
  } catch (err) {
    logger.pipelineError('eventParser', err);
    process.exit(1);
  }

  // ── Step 2: Build the AI prompt ───────────────────────────────────────────
  let prompt;
  try {
    prompt = buildPrompt(issueData);
  } catch (err) {
    logger.pipelineError('promptBuilder', err);
    process.exit(1);
  }

  // ── Step 3: Call the OpenAI API ───────────────────────────────────────────
  let rawResponse;
  try {
    rawResponse = await callOpenAI(prompt);
  } catch (err) {
    logger.pipelineError('openaiClient', err);
    process.exit(1);
  }

  // ── Step 4: Parse and validate the AI response ────────────────────────────
  let parsedResponse;
  try {
    parsedResponse = parseResponse(rawResponse);
  } catch (err) {
    logger.pipelineError('responseParser', err);
    logger.error('Raw AI response that failed parsing', { raw: rawResponse });
    process.exit(1);
  }

  // ── Step 5: Format as markdown ────────────────────────────────────────────
  let markdownComment;
  try {
    markdownComment = formatComment(parsedResponse);
  } catch (err) {
    logger.pipelineError('markdownFormatter', err);
    process.exit(1);
  }

  // ── Step 6: Post the comment to GitHub ────────────────────────────────────
  try {
    await postComment(
      issueData.repoOwner,
      issueData.repoName,
      issueData.number,
      markdownComment
    );
  } catch (err) {
    logger.pipelineError('commentPoster', err);
    process.exit(1);
  }

  logger.info('AI Issue Enhancer pipeline completed successfully.');
}

run();
