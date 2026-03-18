# GitHub Issue Analysis Request

## Objective
Analyze the provided GitHub issue and improve clarity for maintainers and contributors.

## Internal Process (do not output these steps)
1. Classify the issue type.
2. Select the corresponding template.
3. Populate the template using only the provided information.
4. Return the final structured JSON.

## Issue Type Definitions
- `bug`: crashes, errors, or broken functionality
- `feature_request`: request for a new feature
- `improvement`: enhancement to an existing capability
- `ui_ux`: design or usability issue
- `documentation`: documentation error or missing docs
- `performance`: slow execution or resource inefficiency
- `other`: anything else

## Templates

### Bug Template
Use when `issue_type = bug`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `steps_to_reproduce`
- `observed_behavior`
- `expected_behavior`

### Feature Request Template
Use when `issue_type = feature_request`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `proposed_feature`
- `expected_outcome`
- `expected_impact`

### Documentation Template
Use when `issue_type = documentation`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `affected_docs`
- `suggested_change`

### Performance Template
Use when `issue_type = performance`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `current_performance`
- `expected_performance`
- `environment`

### Improvement Template
Use when `issue_type = improvement`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `current_limitation`
- `proposed_improvement`
- `expected_outcome`

### UI/UX Template
Use when `issue_type = ui_ux`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `current_experience`
- `expected_experience`
- `user_impact`
- `design_reference`

### Default Template
Use when `issue_type = other`.
Required fields in `enhanced_issue`:
- `title`
- `summary`
- `observed_behavior`
- `expected_behavior`

## Rules
- Use only the information present in the issue.
- Never invent technical details.
- If information is missing, return `Not specified`.
- Preserve the original meaning and intent.
- If classification confidence is low, use `issue_type = other`.
- Prefix title with issue type when appropriate.
- Example prefixes: `Bug:`, `Feature:`, `Docs:`.
- Summary must be concise and no more than 40 words.
- Do not echo the full input issue text in the output.

## Missing Information
Identify debugging details not provided but useful for investigation.
- Return 0 to 8 concise items.
- Avoid duplicates.

Examples:
- OS or platform
- browser or runtime
- application version
- logs or stack traces
- screenshots
- reproduction steps

## Labels
Suggest relevant GitHub labels.
- Return 1 to 5 labels when possible.
- Labels must be lowercase, kebab-case, and unique.
- Return `[]` if no labels are appropriate.

Examples:
- `bug`
- `enhancement`
- `documentation`
- `ui`
- `performance`
- `needs-info`
- `good-first-issue`

## Output Contract
Return only valid JSON.
Do not include:
- markdown
- explanations
- code fences
- extra top-level keys

Use this schema:
```json
{
  "issue_type": "",
  "enhanced_issue": {},
  "missing_information": [],
  "suggested_labels": []
}
```

`enhanced_issue` must contain exactly the required fields for the selected template.

## Input Issue
Title:
{issue_title}

Description:
{issue_body}
