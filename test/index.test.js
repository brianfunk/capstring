/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

import { describe, it, expect } from 'vitest';
import capstring, { getStyles, isValidStyle, STYLES } from '../index.js';

describe('capstring', () => {
  describe('input validation', () => {
    it('returns a string for valid input', () => {
      expect(typeof capstring('hello world')).toBe('string');
    });

    it('returns false for non-string input', () => {
      expect(capstring(123)).toBe(false);
      expect(capstring(null)).toBe(false);
      expect(capstring(undefined)).toBe(false);
      expect(capstring({})).toBe(false);
      expect(capstring([])).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(capstring('')).toBe(false);
    });

    it('returns unchanged for unknown style', () => {
      expect(capstring('hello world', 'unknown')).toBe('hello world');
    });
  });

  describe('case styles', () => {
    it('same - returns unchanged', () => {
      expect(capstring('HELLO world', 'same')).toBe('HELLO world');
      expect(capstring('HELLO world')).toBe('HELLO world'); // default
    });

    it('none - returns empty string', () => {
      expect(capstring('HELLO world', 'none')).toBe('');
    });

    it('proper - returns unchanged (alias for same)', () => {
      expect(capstring('HELLO world', 'proper')).toBe('HELLO world');
    });

    it('title - Title Case', () => {
      expect(capstring('hello world', 'title')).toBe('Hello World');
      expect(capstring('HELLO WORLD', 'title')).toBe('Hello World');
    });

    it('sentence - Sentence case', () => {
      expect(capstring('hello world', 'sentence')).toBe('Hello world');
      expect(capstring('HELLO WORLD', 'sentence')).toBe('Hello world');
    });

    it('upper - UPPERCASE', () => {
      expect(capstring('hello world', 'upper')).toBe('HELLO WORLD');
    });

    it('lower - lowercase', () => {
      expect(capstring('HELLO WORLD', 'lower')).toBe('hello world');
    });

    it('swap - sWAP cASE', () => {
      expect(capstring('Hello World', 'swap')).toBe('hELLO wORLD');
      expect(capstring('HELLO world', 'swap')).toBe('hello WORLD');
    });
  });

  describe('code styles', () => {
    it('camel - camelCase', () => {
      expect(capstring('hello world', 'camel')).toBe('helloWorld');
      expect(capstring('HELLO WORLD', 'camel')).toBe('helloWorld');
    });

    it('pascal - PascalCase', () => {
      expect(capstring('hello world', 'pascal')).toBe('HelloWorld');
    });

    it('snake - snake_case', () => {
      expect(capstring('hello world', 'snake')).toBe('hello_world');
    });

    it('kebab - kebab-case', () => {
      expect(capstring('hello world', 'kebab')).toBe('hello-world');
    });

    it('slug - slug-case (alias for kebab)', () => {
      expect(capstring('hello world', 'slug')).toBe('hello-world');
    });

    it('constant - CONSTANT_CASE', () => {
      expect(capstring('hello world', 'constant')).toBe('HELLO_WORLD');
    });

    it('python - PYTHON_CASE', () => {
      expect(capstring('hello world', 'python')).toBe('HELLO_WORLD');
    });

    it('python and constant handle multiple spaces consistently', () => {
      // Both should normalize whitespace
      expect(capstring('hello  world', 'python')).toBe('HELLO_WORLD');
      expect(capstring('hello  world', 'constant')).toBe('HELLO_WORLD');
    });

    it('dot - dot.case', () => {
      expect(capstring('hello world', 'dot')).toBe('hello.world');
    });

    it('path - path/case', () => {
      expect(capstring('hello world', 'path')).toBe('hello/world');
    });

    it('train - Train-Case', () => {
      expect(capstring('hello world', 'train')).toBe('Hello-World');
      expect(capstring('foo bar baz', 'train')).toBe('Foo-Bar-Baz');
    });
  });

  describe('fun styles', () => {
    it('leet - l33t sp34k', () => {
      expect(capstring('hello WORLD of Interwebs', 'leet')).toBe('h3££0 w0r£d 0ƒ 1Иt3rw3b$');
    });

    it('reverse - esreveR', () => {
      expect(capstring('Hello World', 'reverse')).toBe('dlroW olleH');
    });

    it('sponge - SpOnGeBoB TeXt (starts uppercase)', () => {
      // Alternates on every character including spaces
      expect(capstring('hello world', 'sponge')).toBe('HeLlO WoRlD');
    });

    it('mock - mOcKiNg TeXt (starts lowercase)', () => {
      // Alternates on every character including spaces
      expect(capstring('hello world', 'mock')).toBe('hElLo wOrLd');
    });

    it('alternate - aLtErNaTiNg (only letters alternate)', () => {
      // Only counts letters, not spaces
      const result = capstring('hello world', 'alternate');
      expect(result).toBe('hElLo WoRlD');
    });

    it('crazy - cRaZy CaSe (deterministic pseudo-random)', () => {
      const result1 = capstring('hello world', 'crazy');
      const result2 = capstring('hello world', 'crazy');
      // Same input should produce same output (deterministic)
      expect(result1).toBe(result2);
      expect(result1.toLowerCase()).toBe('hello world');
    });

    it('random - returns a string (random case)', () => {
      const result = capstring('hello world', 'random');
      expect(typeof result).toBe('string');
      expect(result.toLowerCase()).toBe('hello world');
    });
  });

  describe('new styles', () => {
    it('hashtag - #HelloWorld', () => {
      expect(capstring('hello world', 'hashtag')).toBe('#HelloWorld');
      expect(capstring('foo bar baz', 'hashtag')).toBe('#FooBarBaz');
    });

    it('acronym - first letter of each word', () => {
      expect(capstring('as soon as possible', 'acronym')).toBe('ASAP');
      expect(capstring('hello world', 'acronym')).toBe('HW');
      expect(capstring('frequently asked questions', 'acronym')).toBe('FAQ');
    });

    it('rot13 - ROT13 cipher', () => {
      expect(capstring('hello', 'rot13')).toBe('uryyb');
      expect(capstring('uryyb', 'rot13')).toBe('hello'); // ROT13 is self-inverse
      expect(capstring('Hello World', 'rot13')).toBe('Uryyb Jbeyq');
    });

    it('flip - upside down text', () => {
      expect(capstring('hello', 'flip')).toBe('ollǝɥ');
      expect(capstring('Hello!', 'flip')).toBe('¡ollǝH');
    });
  });
});

describe('getStyles', () => {
  it('returns an array of style names', () => {
    const styles = getStyles();
    expect(Array.isArray(styles)).toBe(true);
    expect(styles.length).toBeGreaterThan(25);
  });

  it('includes common styles', () => {
    const styles = getStyles();
    expect(styles).toContain('title');
    expect(styles).toContain('camel');
    expect(styles).toContain('kebab');
    expect(styles).toContain('snake');
  });

  it('includes new styles', () => {
    const styles = getStyles();
    expect(styles).toContain('train');
    expect(styles).toContain('hashtag');
    expect(styles).toContain('acronym');
    expect(styles).toContain('rot13');
    expect(styles).toContain('flip');
  });
});

describe('isValidStyle', () => {
  it('returns true for valid styles', () => {
    expect(isValidStyle('title')).toBe(true);
    expect(isValidStyle('camel')).toBe(true);
    expect(isValidStyle('kebab')).toBe(true);
    expect(isValidStyle('hashtag')).toBe(true);
  });

  it('returns false for invalid styles', () => {
    expect(isValidStyle('invalid')).toBe(false);
    expect(isValidStyle('')).toBe(false);
    expect(isValidStyle(null)).toBe(false);
  });
});

describe('STYLES constant', () => {
  it('is a frozen array', () => {
    expect(Object.isFrozen(STYLES)).toBe(true);
  });

  it('contains all 29 styles', () => {
    expect(STYLES.length).toBe(29);
  });
});
