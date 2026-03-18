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
- Assigns `severity` and `priority` for faster triage
- Highlights missing debugging information
- Suggests useful labels based on context
- Uses issue-type-specific templates for structured output

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

If you see a warning like:
`Unexpected input(s) 'gemini-retry-attempts', 'gemini-retry-delay-ms'`
your workflow is using an older action release where those inputs do not exist yet.
Use a release/tag that includes the new `action.yml` inputs, or repoint the `v1` tag to the latest release.

IssueCraft accepts provider and credentials from workflow `with` inputs and environment variables.

OpenAI:
- `with.ai-provider: openai` (default)
- API key via `env.OPENAI_API_KEY` or input `openai-api-key`
- model via `env.OPENAI_MODEL` or input `openai-model`

Gemini:
- `with.ai-provider: gemini`
- API key via `env.GEMINI_API_KEY` or input `gemini-api-key`
- model via `env.GEMINI_MODEL` or input `gemini-model`
- retry attempts via `env.GEMINI_RETRY_ATTEMPTS` or input `gemini-retry-attempts`
- retry base delay via `env.GEMINI_RETRY_DELAY_MS` or input `gemini-retry-delay-ms`

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
          gemini-retry-attempts: 5
          gemini-retry-delay-ms: 5000
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
| `gemini.model` | `gemini-2.5-flash` | Model used for Gemini analysis (override with `GEMINI_MODEL` or input `gemini-model`) |
| `gemini.apiBase` | `/v1beta` | Gemini API base path (override with `GEMINI_API_BASE`) |
| `gemini.temperature` | `0.2` | Lower values produce more consistent output |
| `gemini.maxTokens` | `1024` | Max tokens in Gemini model response |
| `gemini.retryAttempts` | `3` | Retry attempts for failed Gemini API calls (override with `GEMINI_RETRY_ATTEMPTS` or input `gemini-retry-attempts`) |
| `gemini.retryDelayMs` | `1500` | Base delay for retry backoff in ms (override with `GEMINI_RETRY_DELAY_MS` or input `gemini-retry-delay-ms`) |
| `gemini.timeoutMs` | `15000` | Request timeout for Gemini API calls in ms |
| `prompt.version` | `1.0.0` | Version shown in comment footer |

Use `LOG_LEVEL=debug` for verbose logs.
Defaults in this table are baseline values; workflow examples may intentionally override them (for example `gemini-retry-attempts: 5`).

---

## AI Output Schema

IssueCraft expects this top-level JSON format from the model:

```json
{
  "issue_type": "",
  "priority": "",
  "priority_reason": "",
  "severity": "",
  "confidence": "",
  "enhanced_issue": {},
  "missing_information": [],
  "suggested_labels": []
}
```

`enhanced_issue` fields vary by `issue_type`:

- `bug`: `title`, `summary`, `steps_to_reproduce`, `observed_behavior`, `expected_behavior`
- `feature_request`: `title`, `summary`, `proposed_feature`, `expected_outcome`, `expected_impact`
- `documentation`: `title`, `summary`, `affected_docs`, `suggested_change`
- `performance`: `title`, `summary`, `current_performance`, `expected_performance`, `environment`
- `improvement`: `title`, `summary`, `current_limitation`, `proposed_improvement`, `expected_outcome`
- `ui_ux`: `title`, `summary`, `current_experience`, `expected_experience`, `user_impact`, `design_reference`
- `other`: `title`, `summary`, `observed_behavior`, `expected_behavior`

### Simple Priority Logic (LLM-Friendly)

IssueCraft determines priority based on:
- severity of the issue
- how many users are likely affected
- whether core functionality is blocked

Priority levels:
- `critical` -> must be fixed immediately
- `high` -> should be fixed soon
- `medium` -> normal priority
- `low` -> minor or optional

Example output:

```json
{
  "issue_type": "bug",
  "priority": "high",
  "priority_reason": "Blocks upload flow for most active users",
  "severity": "critical",
  "confidence": "medium",
  "suggested_labels": ["bug", "priority-high"]
}
```

Why this helps:
- rank issues automatically
- speed up triage
- reduce decision fatigue for maintainers

Validation rules enforced by parser:

- `summary` is limited to 40 words
- `priority_reason` is normalized to a single line and capped at 12 words
- title is prefixed by type when missing (for example `Bug:` / `Feature:` / `Docs:`)
- `priority` and `severity` are normalized to one of: `critical`, `high`, `medium`, `low`
- if `priority` is invalid or missing, it is derived from `severity`
- `confidence` is normalized to one of: `high`, `medium`, `low`
- for `ui_ux`, `design_reference` defaults to `none` when no explicit reference is provided
- `missing_information` is deduplicated and capped at 8 items
- `suggested_labels` is normalized to lowercase kebab-case, deduplicated, capped at 5 items, and includes `priority-<level>`

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
