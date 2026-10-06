/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

import { describe, it, expect, vi, afterEach } from 'vitest';
import capstring, { capstringAll, getStyles, isValidStyle, STYLES, CATEGORIES } from '../index.js';

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

    it('returns empty string for empty string, in every style', () => {
      for (const style of STYLES) {
        expect(capstring('', style)).toBe('');
      }
    });

    it('returns unchanged for unknown style', () => {
      expect(capstring('hello world', 'unknown')).toBe('hello world');
    });

    it('strict: throws TypeError for non-string input', () => {
      expect(() => capstring(123, 'same', { strict: true })).toThrow(TypeError);
      expect(() => capstring(null, 'same', { strict: true })).toThrow(/got null/);
    });

    it('strict: throws RangeError for unknown style', () => {
      expect(() => capstring('hi', 'nope', { strict: true })).toThrow(RangeError);
      expect(() => capstring('hi', 'nope', { strict: true })).toThrow(/unknown style "nope"/);
    });

    it('strict: false and empty options behave like default', () => {
      expect(capstring('hi', 'nope', { strict: false })).toBe('hi');
      expect(capstring('hi', 'upper', {})).toBe('HI');
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
      expect(capstring("don't stop-me now", 'title')).toBe("Don't Stop-Me Now");
      expect(capstring('hello_world', 'title')).toBe('Hello_World');
      expect(capstring('3d printing', 'title')).toBe('3d Printing');
      expect(capstring('"quoted" text', 'title')).toBe('"Quoted" Text');
    });

    it('title - Unicode letters', () => {
      expect(capstring('élan vital über', 'title')).toBe('Élan Vital Über');
      expect(capstring('привет мир', 'title')).toBe('Привет Мир');
    });

    it('sentence - Sentence case', () => {
      expect(capstring('hello world', 'sentence')).toBe('Hello world');
      expect(capstring('HELLO WORLD', 'sentence')).toBe('Hello world');
    });

    it('sentence - capitalizes after . ! ?', () => {
      expect(capstring('hello. world! how? ok', 'sentence')).toBe('Hello. World! How? Ok');
      expect(capstring('hello!  double space', 'sentence')).toBe('Hello!  Double space');
      expect(capstring('wait... really', 'sentence')).toBe('Wait... Really');
      expect(capstring('"hello." she said', 'sentence')).toBe('"Hello." She said');
      expect(capstring('hello. "world" (yes)! [ok]', 'sentence')).toBe('Hello. "World" (yes)! [Ok]');
      expect(capstring('“hello.” she said. ‘yes’ «ok»', 'sentence')).toBe('“Hello.” She said. ‘Yes’ «ok»');
    });

    it('sentence - leaves decimals and abbreviations without spaces alone', () => {
      expect(capstring('3.14 is pi', 'sentence')).toBe('3.14 is pi');
      expect(capstring('see e.g.this', 'sentence')).toBe('See e.g.this');
    });

    it('upper - UPPERCASE', () => {
      expect(capstring('hello world', 'upper')).toBe('HELLO WORLD');
    });

    it('lower - lowercase', () => {
      expect(capstring('HELLO WORLD', 'lower')).toBe('hello world');
    });

    it('swap - inverts case', () => {
      expect(capstring('Hello World', 'swap')).toBe('hELLO wORLD');
      expect(capstring('ÀbÇ 😀 1', 'swap')).toBe('àBç 😀 1');
    });
  });

  describe('word tokenizer (via code styles)', () => {
    const cases = [
      ['hello world', 'hello world'],
      ['  hello   world  ', 'hello world'],
      ['helloWorld', 'hello world'],
      ['HelloWorld', 'hello world'],
      ['hello_world', 'hello world'],
      ['hello-world', 'hello world'],
      ['hello.world', 'hello world'],
      ['hello/world', 'hello world'],
      ['__private_var__', 'private var'],
      ['XMLHttpRequest', 'xml http request'],
      ['getHTTPResponse2XX', 'get http response2 xx'],
      ['utf8 string', 'utf8 string'],
      ['iPhone12 pro', 'i phone12 pro'],
      ['version 2.0 beta', 'version 2 0 beta'],
      ["don't stop", 'dont stop'],
      ['Crème Brûlée', 'crème brûlée'],
      ['Cre\u0300me Bru\u0302le\u0301e', 'crème brûlée'], // NFD input, marks stay attached
      ['ПриветМир', 'привет мир'],
      ['😀 hi!!', 'hi']
    ];

    it.each(cases)('%j tokenizes to %j', (input, words) => {
      expect(capstring(input, 'snake')).toBe(words.replace(/ /g, '_'));
    });

    it('no letters or digits yields empty output for every code style', () => {
      for (const style of CATEGORIES.code) {
        expect(capstring('!!! ???', style)).toBe('');
      }
    });
  });

  describe('code styles', () => {
    it('camel - camelCase', () => {
      expect(capstring('hello world', 'camel')).toBe('helloWorld');
      expect(capstring('Hello World Foo', 'camel')).toBe('helloWorldFoo');
      expect(capstring('XMLHttpRequest hello_world', 'camel')).toBe('xmlHttpRequestHelloWorld');
    });

    it('pascal - PascalCase', () => {
      expect(capstring('hello world', 'pascal')).toBe('HelloWorld');
      expect(capstring('XMLHttpRequest', 'pascal')).toBe('XmlHttpRequest');
    });

    it('snake - snake_case', () => {
      expect(capstring('hello world', 'snake')).toBe('hello_world');
      expect(capstring('Hello World', 'snake')).toBe('hello_world');
    });

    it('kebab - kebab-case, Unicode preserved', () => {
      expect(capstring('hello world', 'kebab')).toBe('hello-world');
      expect(capstring('helloWorld', 'kebab')).toBe('hello-world');
      expect(capstring('Crème Brûlée', 'kebab')).toBe('crème-brûlée');
    });

    it('slug - real URL slug', () => {
      expect(capstring('hello world', 'slug')).toBe('hello-world');
      expect(capstring('Crème Brûlée & Co.', 'slug')).toBe('creme-brulee-co');
      expect(capstring('  --Hello__World--  ', 'slug')).toBe('hello-world');
      expect(capstring('straße', 'slug')).toBe('strasse');
      expect(capstring('ﬁle Æsir Øre', 'slug')).toBe('file-aesir-ore');
      expect(capstring('日本語', 'slug')).toBe('');
      expect(capstring('helloWorld', 'slug')).toBe('hello-world');
      expect(capstring('XMLHttpRequest v2', 'slug')).toBe('xml-http-request-v2');
      expect(capstring("don't", 'slug')).toBe('dont');
      expect(capstring('Cre\u0300me', 'slug')).toBe('creme');
    });

    it('constant - CONSTANT_CASE', () => {
      expect(capstring('hello world', 'constant')).toBe('HELLO_WORLD');
      expect(capstring('helloWorld', 'constant')).toBe('HELLO_WORLD');
    });

    it('python - alias for constant', () => {
      expect(capstring('hello world', 'python')).toBe('HELLO_WORLD');
    });

    it('dot - dot.case', () => {
      expect(capstring('hello world', 'dot')).toBe('hello.world');
    });

    it('path - path/case', () => {
      expect(capstring('hello world', 'path')).toBe('hello/world');
    });

    it('train - Train-Case', () => {
      expect(capstring('hello world', 'train')).toBe('Hello-World');
    });

    it('hashtag - #HashTag', () => {
      expect(capstring('hello world', 'hashtag')).toBe('#HelloWorld');
      expect(capstring('!!!', 'hashtag')).toBe('');
    });

    it('acronym - first letters uppercase', () => {
      expect(capstring('as soon as possible', 'acronym')).toBe('ASAP');
      expect(capstring('XMLHttpRequest', 'acronym')).toBe('XHR');
      expect(capstring('élan vital', 'acronym')).toBe('ÉV');
    });
  });

  describe('fun styles', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('reverse - reverses graphemes', () => {
      expect(capstring('hello world', 'reverse')).toBe('dlrow olleh');
      expect(capstring('héllo 😀 wörld', 'reverse')).toBe('dlröw 😀 olléh');
      expect(capstring('éa', 'reverse')).toBe('aé'); // decomposed accent stays attached
      expect(capstring('a👨‍👩‍👧b', 'reverse')).toBe('b👨‍👩‍👧a');
      expect(capstring('🇺🇸🇫🇷', 'reverse')).toBe('🇫🇷🇺🇸');
    });

    it('sponge - starts uppercase', () => {
      expect(capstring('hello world', 'sponge')).toBe('HeLlO WoRlD');
      expect(capstring('a😀b', 'sponge')).toBe('A😀B'); // emoji counts as one position
    });

    it('mock - starts lowercase', () => {
      expect(capstring('hello world', 'mock')).toBe('hElLo wOrLd');
    });

    it('alternate - letters only, Unicode aware', () => {
      expect(capstring('hello world', 'alternate')).toBe('hElLo WoRlD');
      expect(capstring('àbç déf', 'alternate')).toBe('àBç DéF');
      expect(capstring('a 😀 b', 'alternate')).toBe('a 😀 B');
    });

    it('crazy - deterministic', () => {
      const a = capstring('hello world', 'crazy');
      const b = capstring('hello world', 'crazy');
      expect(a).toBe(b);
      expect(a.toLowerCase()).toBe('hello world');
      expect(a).not.toBe('hello world');
      expect(capstring('a😀b', 'crazy').replace(/[^a-z😀]/giu, '').toLowerCase()).toBe('a😀b');
    });

    it('random - uses Math.random for each code point', () => {
      vi.spyOn(Math, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.1).mockReturnValue(0.9);
      expect(capstring('ab😀', 'random')).toBe('aB😀');
      expect(Math.random).toHaveBeenCalledTimes(3);
    });

    it('clap - claps between words', () => {
      expect(capstring('hello world', 'clap')).toBe('hello 👏 world');
      expect(capstring('  Hello   big  World ', 'clap')).toBe('Hello 👏 big 👏 World');
      expect(capstring('single', 'clap')).toBe('single');
    });

    it('piglatin - English rules', () => {
      expect(capstring('hello world', 'piglatin')).toBe('ellohay orldway');
      expect(capstring('Hello world, quick!', 'piglatin')).toBe('Ellohay orldway, ickquay!');
      expect(capstring('apple', 'piglatin')).toBe('appleway');
      expect(capstring('string', 'piglatin')).toBe('ingstray');
      expect(capstring('shh', 'piglatin')).toBe('shhay');
      expect(capstring('yes my rhythm', 'piglatin')).toBe('esyay ymay ythmrhay');
      expect(capstring('squeal Square squid', 'piglatin')).toBe('ealsquay Aresquay idsquay');
      expect(capstring('123 日本', 'piglatin')).toBe('123 日本');
    });
  });

  describe('encodings', () => {
    it('leet - conventional ASCII map, case preserved', () => {
      expect(capstring('hello world', 'leet')).toBe('h3110 w0r1d');
      expect(capstring('hello WORLD', 'leet')).toBe('h3110 W0R1D');
      expect(capstring('abegilostz', 'leet')).toBe('4839110572');
      expect(capstring('xyz 😀', 'leet')).toBe('xy2 😀');
    });

    it('rot13 - ROT13 cipher', () => {
      expect(capstring('hello', 'rot13')).toBe('uryyb');
      expect(capstring('Hello World', 'rot13')).toBe('Uryyb Jbeyq');
      expect(capstring(capstring('Hello World', 'rot13'), 'rot13')).toBe('Hello World');
    });

    it('morse - International Morse', () => {
      expect(capstring('SOS 1', 'morse')).toBe('... --- ... / .----');
      expect(capstring('hi!', 'morse')).toBe('.... .. -.-.--');
      expect(capstring('a 日 b', 'morse')).toBe('.- / -...'); // unmapped word dropped
      expect(capstring('日', 'morse')).toBe('');
    });

    it('binary - UTF-8 bytes', () => {
      expect(capstring('A', 'binary')).toBe('01000001');
      expect(capstring('hi', 'binary')).toBe('01101000 01101001');
      expect(capstring('é', 'binary')).toBe('11000011 10101001');
      expect(capstring('😀', 'binary').split(' ')).toHaveLength(4);
    });
  });

  describe('unicode art', () => {
    it('flip - upside down', () => {
      expect(capstring('hello', 'flip')).toBe('ollǝɥ');
      expect(capstring('Hello World!', 'flip')).toBe('¡plɹoM ollǝH');
      expect(capstring('héllo 😀', 'flip')).toBe('😀 olléɥ');
      expect(capstring('(a)', 'flip')).toBe('(ɐ)');
    });

    it('smallcaps', () => {
      expect(capstring('Hello', 'smallcaps')).toBe('ʜᴇʟʟᴏ');
      expect(capstring('abcdefghijklmnopqrstuvwxyz', 'smallcaps')).toBe('ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ');
      expect(capstring('A1 Ü 😀', 'smallcaps')).toBe('ᴀ1 Ü 😀');
    });

    it('bubble', () => {
      expect(capstring('Hi 5', 'bubble')).toBe('Ⓗⓘ ⑤');
      expect(capstring('az AZ 09', 'bubble')).toBe('ⓐⓩ ⒶⓏ ⓪⑨');
      expect(capstring('!Ü😀', 'bubble')).toBe('!Ü😀');
    });

    it('wide - fullwidth', () => {
      expect(capstring('Hi!', 'wide')).toBe('Ｈｉ！');
      expect(capstring('a b', 'wide')).toBe('ａ　ｂ');
      expect(capstring('~Ü😀', 'wide')).toBe('～Ü😀');
    });

    it('strike', () => {
      expect(capstring('hi', 'strike')).toBe('h̶i̶');
      expect(capstring('a b', 'strike')).toBe('a̶ b̶');
      expect(capstring('😀', 'strike')).toBe('😀̶');
    });
  });

  describe('capstringAll', () => {
    it('returns every style in STYLES order', () => {
      const all = capstringAll('hello world');
      expect(Object.keys(all)).toEqual([...STYLES]);
      expect(all.title).toBe('Hello World');
      expect(all.none).toBe('');
      for (const value of Object.values(all)) expect(typeof value).toBe('string');
    });

    it('returns false for non-string input', () => {
      expect(capstringAll(42)).toBe(false);
    });

    it('strict: throws for non-string input', () => {
      expect(() => capstringAll(42, { strict: true })).toThrow(TypeError);
      expect(() => capstringAll(null, { strict: true })).toThrow(/got null/);
    });
  });

  describe('helpers', () => {
    it('STYLES has 37 entries and is frozen', () => {
      expect(STYLES).toHaveLength(37);
      expect(Object.isFrozen(STYLES)).toBe(true);
    });

    it('CATEGORIES covers every style exactly once', () => {
      const flat = Object.values(CATEGORIES).flat();
      expect(flat).toHaveLength(STYLES.length);
      expect(new Set(flat).size).toBe(STYLES.length);
      expect([...flat].sort()).toEqual([...STYLES].sort());
      expect(Object.isFrozen(CATEGORIES)).toBe(true);
      expect(Object.isFrozen(CATEGORIES.case)).toBe(true);
    });

    it('getStyles returns a copy of STYLES', () => {
      const styles = getStyles();
      expect(styles).toEqual([...STYLES]);
      styles.push('mutated');
      expect(STYLES).not.toContain('mutated');
    });

    it('isValidStyle', () => {
      expect(isValidStyle('kebab')).toBe(true);
      expect(isValidStyle('piglatin')).toBe(true);
      expect(isValidStyle('invalid')).toBe(false);
      expect(isValidStyle(undefined)).toBe(false);
    });
  });
});
