/**
 * geminiClient.js
 * Sends prompts to the Google Gemini API and returns the raw text.
 * Includes exponential-backoff retry logic for transient failures.
 */

const https   = require('https');
const config  = require('../utils/config');
const logger  = require('../utils/logger');

const {
  model,
  temperature,
  maxTokens,
  retryAttempts,
  retryDelayMs,
  timeoutMs,
  apiBase,
} = config.gemini;

const SYSTEM_INSTRUCTIONS = [
  'You are an expert software engineer and GitHub issue triage assistant.',
  'Follow the user instructions exactly.',
  'Return only valid JSON that matches the required schema.',
  'Do not add markdown, prose, or code fences.',
].join(' ');

/**
 * Calls the Gemini API with the given prompt.
 *
 * @param {string} prompt - The user prompt containing task requirements and issue data.
 * @returns {Promise<string>} Raw text content of the AI response.
 * @throws {Error} after all retry attempts are exhausted.
 */
async function callGemini(prompt) {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    throw new Error('Gemini API key not provided. Set GEMINI_API_KEY or action input gemini-api-key.');
  }
  // Mask key in GitHub Actions logs to prevent accidental exposure.
  process.stdout.write(`::add-mask::${apiKey}\n`);

  const requestBody = JSON.stringify({
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTIONS }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });

  logger.apiCallSent('gemini', model);

  let lastError;
  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const responseText = await makeRequest(requestBody, apiKey);
      return responseText;
    } catch (err) {
      lastError = err;
      if (attempt < retryAttempts) {
        const exponential = retryDelayMs * Math.pow(2, attempt - 1);
        const jitter = Math.floor(Math.random() * 500);
        const delay = Math.max(exponential + jitter, err.retryAfterMs || 0);
        logger.retrying(attempt, retryAttempts, err.message);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `Gemini API failed after ${retryAttempts} attempts. Last error: ${lastError.message}`
  );
}

/**
 * Low-level HTTPS POST to generativelanguage.googleapis.com.
 * @private
 */
function makeRequest(body, apiKey) {
  return new Promise((resolve, reject) => {
    const normalizedApiBase = apiBase.startsWith('/') ? apiBase : `/${apiBase}`;
    const path = `${normalizedApiBase}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const retryAfterMs = parseRetryAfterMs(res.headers['retry-after']);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const parts = parsed?.candidates?.[0]?.content?.parts || [];
            const content = parts
              .filter((part) => typeof part?.text === 'string')
              .map((part) => part.text)
              .join('\n')
              .trim();

            if (!content) {
              reject(new Error(`Unexpected Gemini response structure: ${data}`));
            } else {
              resolve(content);
            }
          } catch {
            reject(new Error(`Failed to parse Gemini response JSON: ${data}`));
          }
        } else if (res.statusCode === 429 || res.statusCode >= 500) {
          // Retriable status codes
          const apiMessage = extractApiErrorMessage(data);
          const err = new Error(
            `Gemini returned status ${res.statusCode} (retriable)${apiMessage ? `: ${apiMessage}` : ''}`
          );
          err.retryAfterMs = retryAfterMs;
          reject(err);
        } else {
          // Non-retriable (e.g. 401, 400) — surface immediately
          reject(new Error(`Gemini returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Gemini request timed out after ${timeoutMs}ms`));
    });
    req.write(body);
    req.end();
  });
}

function parseRetryAfterMs(retryAfterHeader) {
  if (!retryAfterHeader) return 0;

  const headerValue = Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader;
  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.floor(seconds * 1000);
  }

  const dateMs = Date.parse(headerValue);
  if (Number.isNaN(dateMs)) return 0;

  return Math.max(0, dateMs - Date.now());
}

function extractApiErrorMessage(rawBody) {
  try {
    const parsed = JSON.parse(rawBody);
    return parsed?.error?.message || '';
  } catch {
    return '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { callGemini };
