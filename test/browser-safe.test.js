import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('index.js stays browser-safe', () => {
  const src = read('index.js');

  it('has no Node-only imports or globals', () => {
    expect(src).not.toMatch(/from\s+['"]node:/);
    expect(src).not.toMatch(/\bprocess\./);
    expect(src).not.toMatch(/\brequire\(/);
    expect(src).not.toMatch(/import\.meta/);
  });

  it('is the only import of the web app', () => {
    const app = read('web/app.js');
    expect(app).toMatch(/from\s+'\.\/capstring\.js'/);
    expect(read('web/index.html')).toContain('<script type="module" src="./app.js">');
  });

  it('netlify build copies index.js to web/capstring.js', () => {
    expect(read('netlify.toml')).toContain('command = "cp index.js web/capstring.js"');
    expect(read('.gitignore')).toContain('web/capstring.js');
  });
});
