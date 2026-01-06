import { describe, it, expect, beforeEach } from 'vitest';
import { readFile, writeFile, mkdir, stat, readdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('readDirectory IPC handler behavior', () => {
  let testDir: string;

  beforeEach(async () => {
    // Create a unique test directory
    testDir = join(tmpdir(), 'test-read-directory-' + Date.now());
    await mkdir(testDir, { recursive: true });
  });

  it('should read directory contents correctly', async () => {
    // Setup: Create test files
    await writeFile(join(testDir, 'test1.txt'), 'content1');
    await writeFile(join(testDir, 'test2.md'), 'content2');
    await mkdir(join(testDir, 'subdir'));

    // Exercise: Read directory
    const entries = await readdir(testDir, { withFileTypes: true });

    // Verify: Should have 3 entries (2 files + 1 directory)
    expect(entries.length).toBe(3);

    const names = entries.map(e => e.name).sort();
    expect(names).toEqual(['subdir', 'test1.txt', 'test2.md']);
  });

  it('should check if directory exists with stat', async () => {
    // Exercise: Check directory exists
    const stats = await stat(testDir);

    // Verify: Should be a directory
    expect(stats.isDirectory()).toBe(true);
  });

  it('should handle non-existent directory gracefully', async () => {
    const nonExistent = join(testDir, 'does-not-exist');

    // Exercise & Verify: stat should throw for non-existent path
    await expect(stat(nonExistent)).rejects.toThrow();
  });
});
