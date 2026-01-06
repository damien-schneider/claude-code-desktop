# Security Policy

## Supported Versions

Currently, only the latest version of Claude Code Desktop is supported with security updates.

| Version | Supported          |
|---------|--------------------|
| Latest  | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously and appreciate your help in keeping Claude Code Desktop safe.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: **damienschneider@users.noreply.github.com**

### What to Include

Please include as much of the following information as possible:

- **Description**: A clear description of the vulnerability
- **Steps to reproduce**: Detailed steps to reproduce the issue
- **Impact**: What the impact of the vulnerability is
- **Proof of concept**: If possible, include a proof of concept
- **Version**: The version of Claude Code Desktop affected

### What Happens Next

1. **Confirmation**: You will receive an email acknowledgment within 48 hours
2. **Investigation**: We will investigate the report and determine the severity
3. **Resolution**: We will work on a fix and coordinate disclosure with you
4. **Disclosure**: We will disclose the vulnerability once a fix is available

### Timeline

Our goal is to:

- Respond to initial reports within **48 hours**
- Provide a detailed response within **7 days**
- Release a fix within **30 days** (depending on severity)

## Security Best Practices

### For Users

1. **Keep Updated**: Always use the latest version of the app
2. **Verify Downloads**: Only download from official sources (GitHub Releases)
3. **Check Permissions**: Review the permissions the app requests
4. **Report Issues**: Report any suspicious behavior

### For Developers

1. **Dependency Updates**: Keep dependencies up to date
2. **Code Review**: Have security-sensitive code reviewed
3. **Testing**: Write tests for security-critical code
4. **Secrets Management**: Never commit secrets or API keys

## Security Features

Claude Code Desktop includes several security features:

- **Context Isolation**: Electron context isolation is enabled
- **Node Integration**: Disabled in renderer process
- **ASAR**: Application code is packaged in ASAR format
- **Electron Fuses**: Configured for security hardening

## Responsible Disclosure

We follow responsible disclosure practices:

- Vulnerabilities are disclosed after a fix is available
- Credit is given to reporters (if desired)
- We work with reporters to coordinate disclosure

## Security Audits

Periodic security audits are conducted to identify and fix vulnerabilities. Results of audits are made public after fixes are deployed.

## Contact

For security-related matters that are not vulnerability reports, please contact:

**Email**: damienschneider@users.noreply.github.com

For non-security issues, please use [GitHub Issues](https://github.com/damienschneider/claude-code-desktop/issues).

---

Thank you for helping keep Claude Code Desktop secure!
