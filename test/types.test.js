import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { STYLES, CATEGORIES } from '../index.js';

const dts = readFileSync(new URL('../index.d.ts', import.meta.url), 'utf8');

/**
 * Extract the quoted members of a `type X = | 'a' | 'b'` union from the .d.ts
 * @param {string} name - Type name
 * @returns {string[]} Members
 */
const unionMembers = (name) => {
  const match = new RegExp(`export type ${name} =([\\s\\S]*?);`).exec(dts);
  return Array.from(match[1].matchAll(/'([^']+)'/g), (m) => m[1]);
};

describe('index.d.ts', () => {
  it('Style union matches STYLES exactly, in order', () => {
    expect(unionMembers('Style')).toEqual([...STYLES]);
  });

  it('Category union matches CATEGORIES keys', () => {
    expect(unionMembers('Category')).toEqual(Object.keys(CATEGORIES));
  });

  it('declares every runtime export', () => {
    for (const name of ['STYLES', 'CATEGORIES', 'capstring', 'capstringAll', 'getStyles', 'isValidStyle']) {
      expect(dts).toMatch(new RegExp(`export (const|function) ${name}\\b`));
    }
    expect(dts).toContain('export default capstring');
  });
});
