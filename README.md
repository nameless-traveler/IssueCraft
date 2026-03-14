# IssueCraft

![GitHub release](https://img.shields.io/github/v/release/nameless-traveler/issuecraft)
![License](https://img.shields.io/github/license/nameless-traveler/issuecraft)

Automatically rewrite messy GitHub issues into clear bug reports.

IssueCraft is a GitHub Action that analyzes newly opened issues and posts a structured summary as a comment.
It helps maintainers quickly understand the problem and identify missing information.

The action does not modify the original issue. It only adds a comment.

---

## How it works

1. A new issue is opened
2. IssueCraft reads the title and body from the GitHub event
3. The issue text is analyzed using the configured AI provider/model
4. IssueCraft posts a structured summary as a comment

---

## What IssueCraft does

- Rewrites unclear issue titles into something more specific
- Extracts key details from issue text
- Highlights missing debugging information
- Suggests useful labels based on context

---

## Quick example

**Someone opens this issue:**

> Title: "Upload button not working"  
> Body: "Sometimes when I try uploading a PDF the upload does not start."

**IssueCraft posts:**

> ## AI Issue Enhancement
> **Detected Type:** Bug
>
> **Title**  
> Upload button intermittently fails for PDF uploads
>
> **Missing Information**  
> - Browser  
> - Operating system  
> - Exact steps to reproduce
>
> **Suggested Labels**  
> `bug` `upload`

See [`examples/`](./examples) for complete sample input/output.

---

## Why use it?

- Helps maintainers triage faster
- Encourages better bug reports without strict templates
- Gives contributors immediate feedback on missing details
- Keeps all feedback in the issue thread

---

## Requirements

- A GitHub repository with GitHub Actions enabled
- An API key for at least one supported provider:
  - OpenAI (`OPENAI_API_KEY`)
  - Gemini (`GEMINI_API_KEY`)

---

## Setup

### 1. Add this workflow

Create `.github/workflows/issue-enhancer.yml` in your target repository:

```yaml
name: IssueCraft

on:
  issues:
    types: [opened]

jobs:
  enhance-issue:
    runs-on: ubuntu-latest
    permissions:
      issues: write

    steps:
      - uses: nameless-traveler/issuecraft@v1
        with:
          ai-provider: openai
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

`@v1` always points to the latest stable v1 release.
Pin to `@v1.0.0` if you need a fixed build.

IssueCraft accepts provider and credentials from workflow `with` inputs and environment variables.

OpenAI:
- `with.ai-provider: openai` (default)
- API key via `env.OPENAI_API_KEY` or input `openai-api-key`
- model via `env.OPENAI_MODEL` or input `openai-model`

Gemini:
- `with.ai-provider: gemini`
- API key via `env.GEMINI_API_KEY` or input `gemini-api-key`
- model via `env.GEMINI_MODEL` or input `gemini-model`

Gemini workflow example:

```yaml
name: IssueCraft

on:
  issues:
    types: [opened]

jobs:
  enhance-issue:
    runs-on: ubuntu-latest
    permissions:
      issues: write

    steps:
      - uses: nameless-traveler/issuecraft@v1
        with:
          ai-provider: gemini
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

### 2. Add provider API key secret

In your repository, go to:

`Settings -> Secrets and variables -> Actions -> New repository secret`

Create one of:

- Name: `OPENAI_API_KEY`
- Value: your OpenAI API key

or

- Name: `GEMINI_API_KEY`
- Value: your Gemini API key

`github-token` is optional in workflow YAML because the action defaults it to `github.token`.

---

## Configuration

Settings are defined in [`src/utils/config.js`](./src/utils/config.js).

| Setting | Default | Description |
|---|---|---|
| `ai.provider` | `openai` | AI provider used for analysis (`openai` or `gemini`) |
| `openai.model` | `gpt-4o-mini` | Model used for analysis (override with `OPENAI_MODEL` or input `openai-model`) |
| `openai.temperature` | `0.2` | Lower values produce more consistent output |
| `openai.maxTokens` | `1024` | Max tokens in model response |
| `openai.retryAttempts` | `3` | Retry attempts for failed API calls |
| `openai.retryDelayMs` | `1500` | Base delay for retry backoff in ms |
| `openai.timeoutMs` | `15000` | Request timeout for OpenAI API calls in ms |
| `gemini.model` | `gemini-2.0-flash` | Model used for Gemini analysis (override with `GEMINI_MODEL` or input `gemini-model`) |
| `gemini.apiBase` | `/v1beta` | Gemini API base path (override with `GEMINI_API_BASE`) |
| `gemini.temperature` | `0.2` | Lower values produce more consistent output |
| `gemini.maxTokens` | `1024` | Max tokens in Gemini model response |
| `gemini.retryAttempts` | `3` | Retry attempts for failed Gemini API calls |
| `gemini.retryDelayMs` | `1500` | Base delay for retry backoff in ms |
| `gemini.timeoutMs` | `15000` | Request timeout for Gemini API calls in ms |
| `prompt.version` | `1.0.0` | Version shown in comment footer |

Use `LOG_LEVEL=debug` for verbose logs.

---

## Security & Privacy

IssueCraft is designed to be safe to run in standard issue workflows.

It does:
- Read issue title/body from the GitHub event payload
- Send the issue text to the configured AI provider model
- Post one structured comment on the issue

It does not:
- Modify repository code
- Push commits
- Read source files
- Access pull requests
- Persist issue data in this action

For reproducible builds, pin a fixed tag:

```yaml
- uses: nameless-traveler/issuecraft@v1.0.0
```

---

## Project structure

```text
issuecraft/
|-- .github/workflows/
|   `-- issue-enhancer.yml
|-- src/
|   |-- main/runEnhancer.js
|   |-- github/
|   |   |-- eventParser.js
|   |   `-- commentPoster.js
|   |-- ai/
|   |   |-- promptBuilder.js
|   |   |-- aiClient.js
|   |   |-- geminiClient.js
|   |   |-- openaiClient.js
|   |   `-- responseParser.js
|   |-- formatter/
|   |   `-- markdownFormatter.js
|   `-- utils/
|       |-- config.js
|       `-- logger.js
|-- prompts/
|   `-- issue-enhancement.md
|-- examples/
|   |-- messy_issue_example.md
|   `-- expected_output_example.md
|-- assets/
|   `-- issuecraft-logo.svg
|-- action.yml
`-- package.json
```

---

IssueCraft is currently in its first release and will continue evolving as improvements are added.

---

## License

[MIT](./LICENSE)
