import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { STYLES } from '../index.js';
import { RESERVED, FORMATS } from '../netlify/functions/api.js';

const spec = JSON.parse(readFileSync(new URL('../web/openapi.json', import.meta.url), 'utf8'));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

describe('web/openapi.json', () => {
  it('is OpenAPI 3.1 and tracks the package version', () => {
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.version).toBe(pkg.version);
    expect(spec.servers[0].url).toBe('https://capstring.netlify.app/api');
  });

  it('documents every named endpoint and the generic transform route', () => {
    const paths = Object.keys(spec.paths);
    for (const segment of RESERVED) {
      expect(paths.some((p) => p === `/${segment}` || p.startsWith(`/${segment}/`))).toBe(true);
    }
    expect(paths).toContain('/{style}/{text}');
    expect(spec.paths['/batch'].post).toBeDefined();
  });

  it('keeps the style enum and format enum in sync with the code', () => {
    expect(spec.components.schemas.StyleName.enum).toEqual([...STYLES]);
    expect([...spec.components.parameters.format.schema.enum].sort()).toEqual([...FORMATS, 'yml'].sort());
  });

  it('every operation has an operationId, summary, tag, and a 200 response', () => {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        expect(op.operationId, `${method} ${path}`).toBeTruthy();
        expect(op.summary, `${method} ${path}`).toBeTruthy();
        expect(op.tags?.length, `${method} ${path}`).toBeGreaterThan(0);
        expect(op.responses['200'], `${method} ${path}`).toBeDefined();
        for (const tag of op.tags) expect(spec.tags.map((t) => t.name)).toContain(tag);
      }
    }
  });

  it('only references components that exist', () => {
    const refs = JSON.stringify(spec).match(/"#\/components\/[^"]+"/g).map((r) => r.slice(2, -1).split('/').slice(1));
    for (const [, kind, name] of refs) {
      expect(spec.components[kind]?.[name], `${kind}/${name}`).toBeDefined();
    }
  });

  it('never shows a personal name on the site', () => {
    const files = ['../web/openapi.json', '../web/index.html', '../web/404.html', '../web/site.js', '../web/docs/index.html', '../web/dev/index.html', '../web/dev/README.md'];
    for (const f of files) expect(readFileSync(new URL(f, import.meta.url), 'utf8')).not.toMatch(/Brian|Funk/);
  });

  it('the docs page loads the spec from the same place it is published', () => {
    const docs = readFileSync(new URL('../web/docs/index.html', import.meta.url), 'utf8');
    expect(docs).toContain("url: '/openapi.json'");
    expect(docs).toContain('cdnjs.cloudflare.com/ajax/libs/swagger-ui/');
    const home = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
    expect(home).toContain('href="/docs/"');
  });
});
