# GitHub Issue Analysis Request

## Objective
Analyze the provided GitHub issue and improve clarity for maintainers and contributors.

## Required Workflow
1. Determine the most accurate issue type.
2. Rewrite the issue details clearly and consistently.
3. Identify missing debugging details that would help investigation.
4. Suggest practical GitHub labels.

## Allowed Issue Types
- `bug`
- `feature_request`
- `improvement`
- `ui_ux`
- `documentation`
- `performance`
- `other`

## Rules
- Do not invent technical details.
- Use only the information provided in the issue.
- If information is missing, use `Not specified`.
- Preserve the original meaning and intent.

## Output Contract
Return only valid JSON.
- No markdown.
- No explanation text.
- No code fences.
- No extra keys.

Use exactly this schema:
```json
{
  "issue_type": "",
  "enhanced_issue": {
    "title": "",
    "summary": "",
    "steps_to_reproduce": "",
    "observed_behavior": "",
    "expected_behavior": ""
  },
  "missing_information": [],
  "suggested_labels": []
}
```

## Input Issue
### Title
{issue_title}

### Description
{issue_body}
