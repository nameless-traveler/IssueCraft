/**
 * openaiClient.js
 * Sends prompts to the OpenAI Chat Completions API and returns the raw text.
 * Includes exponential-backoff retry logic for transient failures.
 */

const https   = require('https');
const config  = require('../utils/config');
const logger  = require('../utils/logger');

const { model, temperature, maxTokens, retryAttempts, retryDelayMs, timeoutMs } =
  config.openai;

const SYSTEM_INSTRUCTIONS = [
  'You are an expert software engineer and GitHub issue triage assistant.',
  'Follow the user instructions exactly.',
  'Return only valid JSON that matches the required schema.',
  'Do not add markdown, prose, or code fences.',
].join(' ');

/**
 * Calls the OpenAI Chat Completions API with the given prompt.
 *
 * @param {string} prompt - The user prompt containing task requirements and issue data.
 * @returns {Promise<string>} Raw text content of the AI response.
 * @throws {Error} after all retry attempts are exhausted.
 */
async function callOpenAI(prompt) {
  const apiKey = config.openai.apiKey;
  if (!apiKey) {
    throw new Error('OpenAI API key not provided. Set OPENAI_API_KEY or action input openai-api-key.');
  }
  // Mask key in GitHub Actions logs to prevent accidental exposure.
  process.stdout.write(`::add-mask::${apiKey}\n`);

  const requestBody = JSON.stringify({
    model,
    temperature,
    max_tokens: maxTokens,
    messages: [
      {
        role:    'system',
        content: SYSTEM_INSTRUCTIONS,
      },
      {
        role:    'user',
        content: prompt,
      },
    ],
  });

  logger.apiCallSent(model);

  let lastError;

  for (let attempt = 1; attempt <= retryAttempts; attempt++) {
    try {
      const responseText = await makeRequest(requestBody, apiKey);
      return responseText;
    } catch (err) {
      lastError = err;

      if (attempt < retryAttempts) {
        const delay = retryDelayMs * Math.pow(2, attempt - 1); // exponential back-off
        logger.retrying(attempt, retryAttempts, err.message);
        await sleep(delay);
      }
    }
  }

  throw new Error(
    `OpenAI API failed after ${retryAttempts} attempts. Last error: ${lastError.message}`
  );
}

/**
 * Low-level HTTPS POST to api.openai.com.
 * @private
 */
function makeRequest(body, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path:     '/v1/chat/completions',
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Authorization':  `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.message?.content;
            if (!content) {
              reject(new Error(`Unexpected OpenAI response structure: ${data}`));
            } else {
              resolve(content);
            }
          } catch {
            reject(new Error(`Failed to parse OpenAI response JSON: ${data}`));
          }
        } else if (res.statusCode === 429 || res.statusCode >= 500) {
          // Retriable status codes
          reject(new Error(`OpenAI returned status ${res.statusCode} (retriable)`));
        } else {
          // Non-retriable (e.g. 401, 400) — surface immediately
          reject(new Error(`OpenAI returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`OpenAI request timed out after ${timeoutMs}ms`));
    });
    req.write(body);
    req.end();
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { callOpenAI };
