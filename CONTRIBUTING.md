# Contributing to Claude Code Desktop

Thank you for your interest in contributing to Claude Code Desktop! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful and constructive in all interactions. We're all here to build something great together.

## Getting Started

### Prerequisites

- **Node.js** 24 or later
- **Bun** - Install with `curl -fsSL https://bun.sh/install | bash`
- **Git** - For version control

### Setup

1. **Fork the repository**

   Click the "Fork" button in the top-right of the repository page.

2. **Clone your fork**

```bash
git clone https://github.com/YOUR_USERNAME/claude-code-desktop.git
cd claude-code-desktop
```

3. **Install dependencies**

```bash
bun install
```

4. **Start development server**

```bash
bun run start
```

The app should now be running in development mode with hot reload enabled.

## Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test-related changes

### 2. Make Your Changes

- Write clear, concise code
- Follow the coding standards below
- Test your changes thoroughly

### 3. Test Your Changes

Before committing, run the test suite:

```bash
# Run all tests
bun run test:all

# Run unit tests only
bun run test:unit

# Run E2E tests
bun run test:e2e
```

### 4. Code Quality Checks

Run linting and formatting:

```bash
# Check formatting
bun run format

# Fix formatting issues
bun run format:write

# Run linter
bun run lint
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper type definitions
- Use interfaces for object shapes
- Use type aliases for union types

### React

- Use functional components with hooks
- Follow the Rules of Hooks
- Use TypeScript for prop types
- Keep components small and focused

### Styling

- Use Tailwind CSS utility classes
- Follow the existing design system
- Use shadcn/ui components when available
- Maintain consistency with existing UI

### File Organization

- Keep files logically organized
- Use descriptive file names
- One component per file
- Group related files together

## Testing

### Unit Tests

- Write unit tests for new functionality
- Test edge cases and error conditions
- Mock external dependencies
- Keep tests fast and focused

### E2E Tests

- Write E2E tests for critical user flows
- Use Playwright for E2E testing
- Test on multiple platforms when possible
- Keep tests maintainable

### Test Coverage

- Aim for high test coverage
- Focus on testing business logic
- Don't test trivial code
- Test user interactions

## Commit Messages

Follow these guidelines for commit messages:

### Format

```
type(scope): subject

body

footer
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

Good:
```
feat(ui): add dark mode toggle

Add a toggle button in settings to switch between light and dark themes.
The preference is saved to localStorage and persists across sessions.

Closes #123
```

```
fix(auth): resolve token refresh issue

Fix bug where auth token wasn't being refreshed properly,
causing users to be logged out unexpectedly.

Fixes #456
```

Bad:
```
update stuff
fix bug
changes
```

## Pull Requests

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Run all tests** and ensure they pass
4. **Update CHANGELOG** if applicable
5. **Rebase** your branch if needed

### PR Title

Use the same format as commit messages:

```
feat(ui): add dark mode toggle
fix(auth): resolve token refresh issue
```

### PR Description

Include:
- **What** changes were made
- **Why** the changes were needed
- **How** to test the changes
- **Screenshots** for UI changes
- **Related issues** using `Fixes #123`

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] Tests pass locally
- [ ] Documentation is updated
- [ ] Commit messages follow guidelines
- [ ] PR description is clear and complete

### Review Process

1. Automated checks must pass (CI/CD)
2. Code review by maintainers
3. Address review feedback
4. Approval from at least one maintainer
5. Merge by maintainer

## Reporting Issues

### Before Reporting

1. **Search existing issues** - Your issue may already be reported
2. **Check the documentation** - The answer might be there
3. **Try the latest version** - Your issue may already be fixed

### Issue Report Template

When creating a new issue, use the appropriate template and include:

- **Clear title** describing the problem
- **Detailed description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (OS, app version, etc.)
- **Screenshots** if applicable
- **Logs** if available

### Feature Requests

We welcome feature requests! Please:

- **Describe the feature** clearly
- **Explain the use case** - Why do you need it?
- **Suggest a solution** if you have ideas
- **Consider alternatives** - How might this be solved differently?

## Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Existing Issues**: See if someone has already asked

## Recognition

Contributors will be recognized in:
- The project's contributors list
- Release notes for significant contributions
- The README for major contributors

Thank you for contributing to Claude Code Desktop!
