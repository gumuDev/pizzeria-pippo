# Skill: Git Commit Standard

## Purpose
Create git commits following strict authorship rules. The AI must never add itself as a co-author.

## Rules

1. The commit author MUST always be:
   Name: Luis Gumucio Flores
   Email: luisgumucioflores@gmail.com

2. Never include:
   - Co-authored-by
   - Generated-by
   - AI attribution
   - Any AI signature

3. The commit must look like it was written only by the human developer.

4. Use clean and professional commit messages.

## Commit Format

Use conventional commits when possible:

type(scope): short description

Examples:

feat(api): add product search endpoint
fix(auth): resolve token expiration bug
refactor(ui): simplify dashboard layout
docs(readme): update installation steps

## Commit Execution

When committing, enforce the author explicitly:

git commit --author="Luis Gumucio <luisgumucioflores@gmail.com>" -m "<message>"

## Forbidden

Do NOT add lines such as:

Co-authored-by: Claude
Co-authored-by: ChatGPT
Generated-by: AI
AI-assisted

These must NEVER appear in the commit message.

## Behavior

If generating commits automatically:
- write the commit
- ensure the author is Luis Gumucio Flores
- verify the message contains no AI attribution