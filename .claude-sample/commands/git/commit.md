---
description: Create a git commit with conventional commit format
---

# Git Commit

$ARGUMENTS

## Conventional Commit Format

Create a git commit following the conventional commit specification:

### Commit Message Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests
- **chore**: Changes to the build process or auxiliary tools

### Example

```
feat(auth): add user authentication

Implement JWT-based authentication with the following:
- Login endpoint with email/password
- Token refresh mechanism
- Password reset flow

Closes #123
```

Generate a commit message based on the staged changes.
