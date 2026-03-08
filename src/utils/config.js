/**
 * config.js
 * Central configuration for IssueCraft.
 * All tuneable parameters live here; import this instead of hardcoding values.
 */

function readInputOrEnv(inputName, envName) {
  const inputKeyLegacy = `INPUT_${inputName}`;
  const inputKeyUnderscore = `INPUT_${inputName.replace(/-/g, '_')}`;
  return process.env[envName]
    || process.env[inputKeyUnderscore]
    || process.env[inputKeyLegacy];
}

const config = {
  openai: {
    model: readInputOrEnv('OPENAI-MODEL', 'OPENAI_MODEL') || 'gpt-4o-mini',
    apiKey: readInputOrEnv('OPENAI-API-KEY', 'OPENAI_API_KEY'),
    temperature: 0.2,
    maxTokens: 1024,
    retryAttempts: 3,
    retryDelayMs: 1500,
    timeoutMs: 15000,
  },

  prompt: {
    version: '1.0.0',
    templatePath: 'prompts/issue-enhancement.txt',
  },

  github: {
    apiBase: 'https://api.github.com',
    token: readInputOrEnv('GITHUB-TOKEN', 'GITHUB_TOKEN'),
    eventPath: process.env.GITHUB_EVENT_PATH,
  },

  logging: {
    level: readInputOrEnv('LOG-LEVEL', 'LOG_LEVEL') || 'info', // 'debug' | 'info' | 'warn' | 'error'
  },
};

module.exports = config;
