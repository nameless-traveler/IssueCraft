/**
 * aiClient.js
 * Provider selector for LLM API calls.
 */

const config = require('../utils/config');
const { callOpenAI } = require('./openaiClient');
const { callGemini } = require('./geminiClient');

async function callAI(prompt) {
  const provider = config.ai.provider;

  if (provider === 'openai') {
    return callOpenAI(prompt);
  }

  if (provider === 'gemini') {
    return callGemini(prompt);
  }

  throw new Error(`Unsupported AI provider "${provider}". Allowed values: openai, gemini.`);
}

module.exports = { callAI };
