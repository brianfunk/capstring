import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', ROOT), 'utf8'));

/** The complete list of files allowed in the npm tarball. Add here deliberately, never by accident. */
const ALLOWED_FILES = ['LICENSE', 'README.md', 'bin/capstring.js', 'cli.js', 'index.d.ts', 'index.js', 'package.json'];

/** Unpacked size budget in bytes. Raise only with a reason in the commit message. */
const MAX_UNPACKED_BYTES = 50 * 1024;

describe('npm package stays lean', () => {
  const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8' }));

  it('ships exactly the allowed files (no web/, netlify/, tests, or configs)', () => {
    expect(pack.files.map((f) => f.path).sort()).toEqual([...ALLOWED_FILES].sort());
  });

  it('stays under the size budget', () => {
    expect(pack.unpackedSize).toBeLessThan(MAX_UNPACKED_BYTES);
  });

  it('has zero runtime dependencies', () => {
    expect(pkg.dependencies ?? {}).toEqual({});
    expect(pkg.peerDependencies ?? {}).toEqual({});
  });
});
