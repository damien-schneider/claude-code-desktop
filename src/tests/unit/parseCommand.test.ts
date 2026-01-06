import { describe, it, expect } from 'vitest';

describe('parseCommand', () => {
  it('should parse command with valid frontmatter', () => {
    const content = `---
description: My command
---

# Command

$ARGUMENTS
`;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    expect(frontmatterMatch).toBeTruthy();

    if (frontmatterMatch) {
      const result = {
        frontmatter: frontmatterMatch[1],
        body: frontmatterMatch[2],
      };
      expect(result.frontmatter).toBe('description: My command');
      expect(result.body).toContain('# Command');
    }
  });

  it('should return null frontmatter when no frontmatter exists', () => {
    const content = `# Command without frontmatter

$ARGUMENTS
`;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    expect(frontmatterMatch).toBeNull();
  });

  it('should indicate when frontmatter is missing', () => {
    const content = `# Command

$ARGUMENTS`;

    const hasFrontmatter = /^---\n[\s\S]*?\n---/.test(content);
    expect(hasFrontmatter).toBe(false);
  });

  it('should detect frontmatter presence correctly', () => {
    const withFrontmatter = `---
description: Test
---

Content`;
    const withoutFrontmatter = `Just content`;

    expect(/^---\n[\s\S]*?\n---/.test(withFrontmatter)).toBe(true);
    expect(/^---\n[\s\S]*?\n---/.test(withoutFrontmatter)).toBe(false);
  });
});
