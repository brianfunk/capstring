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
    const html = read('web/index.html');
    for (const fmt of ['json', 'txt', 'html', 'xml', 'yaml', 'csv', 'jsonp']) expect(html).toContain(`<option value="${fmt}">`);
    for (const route of ['/api/:style/:text', '/api/all/:text', '/api/chain/:styles/:text', '/api/batch', '/api/spell/:text', '/api/count/:text', '/api/lorem/:count', '/api/badge/:style/:text', '/api/styles']) {
      expect(html).toContain(route);
    }
  });

  it('netlify build copies index.js to web/capstring.js and never skips an uncached deploy', () => {
    const toml = read('netlify.toml');
    expect(toml).toMatch(/command = "cp index.js web\/capstring.js/);
    expect(toml).toMatch(/ignore = "test \\"\$CACHED_COMMIT_REF\\" = \\"\$COMMIT_REF\\" && exit 1;/);
    expect(toml).toMatch(/ignore = .*package-lock\.json"/); // lockfile-only commits must still rebuild
    expect(read('.gitignore')).toContain('web/capstring.js');
  });
});
