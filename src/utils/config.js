/**
 * config.js
 * Central configuration for the AI Issue Enhancer.
 * All tuneable parameters live here — import this instead of hardcoding values.
 */

const config = {
  // ─── OpenAI ───────────────────────────────────────────────────────────────
  openai: {
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    temperature: 0.2,
    maxTokens: 1024,
    retryAttempts: 3,
    retryDelayMs: 1500,
  },

  // ─── Prompt ───────────────────────────────────────────────────────────────
  prompt: {
    version: '1.0.0',
    templatePath: 'prompts/issue-enhancement.txt',
  },

  // ─── GitHub ───────────────────────────────────────────────────────────────
  github: {
    apiBase: 'https://api.github.com',
    token: process.env.GITHUB_TOKEN,
    eventPath: process.env.GITHUB_EVENT_PATH,
  },

  // ─── Logging ──────────────────────────────────────────────────────────────
  logging: {
    level: process.env.LOG_LEVEL || 'info', // 'debug' | 'info' | 'warn' | 'error'
  },
};

module.exports = config;
