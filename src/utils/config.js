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

function readNumberInputOrEnv(inputName, envName, defaultValue) {
  const raw = readInputOrEnv(inputName, envName);
  if (raw === undefined || raw === null || raw === '') return defaultValue;
  const value = Number(raw);
  return Number.isFinite(value) ? value : defaultValue;
}

const config = {
  ai: {
    provider: String(readInputOrEnv('AI-PROVIDER', 'AI_PROVIDER') || 'openai').trim().toLowerCase(),
  },

  openai: {
    model: readInputOrEnv('OPENAI-MODEL', 'OPENAI_MODEL') || 'gpt-4o-mini',
    apiKey: readInputOrEnv('OPENAI-API-KEY', 'OPENAI_API_KEY'),
    temperature: 0.2,
    maxTokens: 1024,
    retryAttempts: 3,
    retryDelayMs: 1500,
    timeoutMs: 15000,
  },

  gemini: {
    model: readInputOrEnv('GEMINI-MODEL', 'GEMINI_MODEL') || 'gemini-2.5-flash',
    apiKey: readInputOrEnv('GEMINI-API-KEY', 'GEMINI_API_KEY'),
    apiBase: readInputOrEnv('GEMINI-API-BASE', 'GEMINI_API_BASE') || '/v1beta',
    temperature: readNumberInputOrEnv('GEMINI-TEMPERATURE', 'GEMINI_TEMPERATURE', 0.2),
    maxTokens: readNumberInputOrEnv('GEMINI-MAX-TOKENS', 'GEMINI_MAX_TOKENS', 1024),
    retryAttempts: readNumberInputOrEnv('GEMINI-RETRY-ATTEMPTS', 'GEMINI_RETRY_ATTEMPTS', 3),
    retryDelayMs: readNumberInputOrEnv('GEMINI-RETRY-DELAY-MS', 'GEMINI_RETRY_DELAY_MS', 1500),
    timeoutMs: readNumberInputOrEnv('GEMINI-TIMEOUT-MS', 'GEMINI_TIMEOUT_MS', 15000),
  },

  prompt: {
    version: '2.0.0',
    templatePath: 'prompts/issue-enhancement.md',
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
