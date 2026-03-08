/**
 * logger.js
 * Lightweight structured logger for the AI Issue Enhancer pipeline.
 * Outputs timestamped, levelled log lines to stdout/stderr.
 */

const config = require('./config');

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const currentLevel = LEVELS[config.logging.level] ?? LEVELS.info;

function timestamp() {
  return new Date().toISOString();
}

function format(level, message, meta = {}) {
  const hasMeta = Object.keys(meta).length > 0;
  const metaStr = hasMeta ? `  ${JSON.stringify(meta)}` : '';
  return `[${timestamp()}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

function log(level, message, meta) {
  if (LEVELS[level] < currentLevel) return;
  const line = format(level, message, meta);
  if (level === 'error' || level === 'warn') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}

const logger = {
  debug: (msg, meta) => log('debug', msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  error: (msg, meta) => log('error', msg, meta),

  // ─── Named pipeline events ───────────────────────────────────────────────
  issueReceived:   (issueNumber, title) =>
    log('info', `Issue received: #${issueNumber}`, { title }),

  promptGenerated: (length) =>
    log('info', 'Prompt generated', { characters: length }),

  apiCallSent: (model) =>
    log('info', 'OpenAI API call sent', { model }),

  responseReceived: (issueType) =>
    log('info', 'AI response received and parsed', { issue_type: issueType }),

  commentPosted: (issueNumber, url) =>
    log('info', `Bot comment posted on #${issueNumber}`, { url }),

  retrying: (attempt, maxAttempts, reason) =>
    log('warn', `Retrying AI call (${attempt}/${maxAttempts})`, { reason }),

  pipelineError: (stage, error) =>
    log('error', `Pipeline failed at stage: ${stage}`, { message: error.message }),
};

module.exports = logger;
