import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { main } from '../cli.js';
import { STYLES } from '../index.js';

const BIN = fileURLToPath(new URL('../bin/capstring.js', import.meta.url));
const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

/**
 * Run the CLI in-process with fake I/O
 * @param {string[]} argv - Arguments
 * @param {{ stdin?: string, isTTY?: boolean }} [opts] - Fake stdin content and TTY flag
 */
const run = async (argv, { stdin = '', isTTY = false } = {}) => {
  let out = '';
  let err = '';
  const code = await main(argv, {
    readStdin: async () => stdin,
    isTTY,
    stdout: (s) => { out += s; },
    stderr: (s) => { err += s; }
  });
  return { code, out, err };
};

describe('cli main()', () => {
  it('--help / -h prints usage to stdout, exit 0', async () => {
    for (const flag of ['--help', '-h']) {
      const r = await run([flag]);
      expect(r.code).toBe(0);
      expect(r.out).toContain('Usage:');
      expect(r.err).toBe('');
    }
  });

  it('--version / -v prints package version', async () => {
    expect((await run(['--version'])).out).toBe(`${version}\n`);
    expect((await run(['-v'])).out).toBe(`${version}\n`);
  });

  it('--list / -l prints every style', async () => {
    const r = await run(['--list']);
    expect(r.code).toBe(0);
    expect(r.out.trim().split('\n')).toEqual([...STYLES]);
    expect((await run(['-l'])).out).toBe(r.out);
  });

  it('--list --json prints a JSON array', async () => {
    const r = await run(['--list', '--json']);
    expect(JSON.parse(r.out)).toEqual([...STYLES]);
  });

  it('transforms text arguments joined by one space', async () => {
    const r = await run(['title', 'hello', 'world']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('Hello World\n');
  });

  it('--json with a style prints an object', async () => {
    const r = await run(['kebab', '--json', 'Hello World']);
    expect(JSON.parse(r.out)).toEqual({ input: 'Hello World', style: 'kebab', output: 'hello-world' });
  });

  it('--all / -a prints one line per style', async () => {
    const r = await run(['--all', 'hi']);
    expect(r.code).toBe(0);
    const lines = r.out.trimEnd().split('\n');
    expect(lines).toHaveLength(STYLES.length);
    expect(lines[0]).toMatch(/^same\s+hi$/);
    expect(lines.find((l) => l.startsWith('none'))).toMatch(/^none\s*$/);
    const short = await run(['-a', 'hi']);
    expect(short.out.split('\n')).toHaveLength(r.out.split('\n').length);
  });

  it('--all keeps one row per style for multiline input', async () => {
    const r = await run(['--all'], { stdin: 'a\nb\n' });
    expect(r.out.trimEnd().split('\n')).toHaveLength(STYLES.length);
    expect(r.out).toMatch(/^same\s+a\\nb$/m);
    const ls = await run(['--all'], { stdin: 'a\u2028b\u2029c' });
    expect(ls.out.trimEnd().split('\n')).toHaveLength(STYLES.length);
    expect(ls.out).toMatch(/^same\s+a\\u2028b\\u2029c$/m);
  });

  it('--all --json prints an object keyed by style', async () => {
    const r = await run(['--all', '--json', 'hi']);
    const obj = JSON.parse(r.out);
    expect(Object.keys(obj)).toEqual([...STYLES]);
    expect(obj.upper).toBe('HI');
  });

  it('accepts flags after the text', async () => {
    expect((await run(['hello world', '--all'])).out.split('\n')[0]).toMatch(/^same\s+hello world$/);
    expect((await run(['hello', 'upper', '--json'])).code).toBe(2); // first positional is still the style
    expect((await run(['upper', 'hi', '--json'])).out).toBe('{"input":"hi","style":"upper","output":"HI"}\n');
  });

  it('--count / -c prints counts, plain or JSON', async () => {
    expect((await run(['--count', 'hello world'])).out).toBe('words: 2, chars: 11, chars (no spaces): 10, spaces: 1\n');
    expect((await run(['-c', 'hello world', '--json'])).out).toBe('{"words":2,"characters":11,"charactersNoSpaces":10,"spaces":1}\n');
    expect((await run(['--count'], { stdin: 'a b\n' })).out).toContain('words: 2');
  });

  it('-- ends option parsing', async () => {
    const r = await run(['upper', '--', '--not-a-flag']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('--NOT-A-FLAG\n');
  });

  it('a lone dash is treated as text', async () => {
    expect((await run(['upper', '-'])).out).toBe('-\n');
  });

  it('reads stdin when no text is given, stripping one trailing newline', async () => {
    expect((await run(['title'], { stdin: 'hello world\n' })).out).toBe('Hello World\n');
    expect((await run(['title'], { stdin: 'hello\r\n' })).out).toBe('Hello\n');
    expect((await run(['upper'], { stdin: 'a\n\n' })).out).toBe('A\n\n');
    expect((await run(['upper'], { stdin: '' })).out).toBe('\n');
  });

  it('unknown style exits 2 with a hint', async () => {
    const r = await run(['nope', 'x']);
    expect(r.code).toBe(2);
    expect(r.out).toBe('');
    expect(r.err).toContain('unknown style "nope"');
    expect(r.err).toContain('--list');
  });

  it('unknown option exits 2 with usage', async () => {
    const r = await run(['--wat', 'upper', 'x']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('unknown option "--wat"');
    expect(r.err).toContain('Usage:');
  });

  it('no arguments exits 2 with usage', async () => {
    const r = await run([]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('Usage:');
  });

  it('no text on a TTY exits 2 with usage', async () => {
    const r = await run(['upper'], { isTTY: true });
    expect(r.code).toBe(2);
    expect(r.err).toContain('Usage:');
  });
});

describe('bin/capstring.js', () => {
  it('runs with arguments', () => {
    expect(execFileSync(process.execPath, [BIN, 'upper', 'hi'], { encoding: 'utf8' })).toBe('HI\n');
  });

  it('reads piped stdin', () => {
    const out = execFileSync(process.execPath, [BIN, 'title'], { input: 'hello world\n', encoding: 'utf8' });
    expect(out).toBe('Hello World\n');
  });

  it('exits 2 for an unknown style', () => {
    const r = spawnSync(process.execPath, [BIN, 'nope', 'x'], { encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('unknown style');
  });
});
