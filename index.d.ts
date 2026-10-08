/**
 * capstring - CaPiTaLiZe StRiNgS!
 */

/** Every supported style name. */
export type Style =
  // Case
  | 'same' | 'none' | 'proper' | 'title' | 'sentence' | 'upper' | 'lower' | 'swap'
  // Code
  | 'camel' | 'pascal' | 'snake' | 'kebab' | 'slug' | 'constant' | 'python' | 'dot' | 'path' | 'train'
  // Fun
  | 'leet' | 'reverse' | 'sponge' | 'mock' | 'alternate' | 'crazy' | 'random'
  // Added in 1.0.0
  | 'hashtag' | 'acronym' | 'rot13' | 'flip'
  // Added in 1.1.0
  | 'smallcaps' | 'bubble' | 'wide' | 'strike' | 'clap' | 'morse' | 'binary' | 'piglatin';

/** Style category names. */
export type Category = 'case' | 'code' | 'fun' | 'encoding' | 'art';

export interface CapstringOptions {
  /**
   * Throw `TypeError` for non-string input and `RangeError` for an unknown style,
   * instead of returning `false` / the input unchanged. Default `false`.
   */
  strict?: boolean;
}

/** All supported styles, frozen, in canonical order. */
export const STYLES: readonly Style[];

/** Styles grouped by category. Every style appears in exactly one category. */
export const CATEGORIES: Readonly<Record<Category, readonly Style[]>>;

/**
 * Transform a string to the given style.
 *
 * @example
 * capstring('hello world', 'title') // 'Hello World'
 * capstring('XMLHttpRequest', 'kebab') // 'xml-http-request'
 */
export function capstring(str: string, style?: Style | (string & {}), options?: CapstringOptions): string;
export function capstring(str: unknown, style?: Style | (string & {}), options?: CapstringOptions): string | false;

/**
 * Transform a string into every style at once, keyed by style name in `STYLES` order.
 */
export function capstringAll(str: string, options?: CapstringOptions): Record<Style, string>;
export function capstringAll(str: unknown, options?: CapstringOptions): Record<Style, string> | false;

/** A fresh copy of `STYLES`. */
export function getStyles(): Style[];

/** Whether `style` is a supported style name. */
export function isValidStyle(style: unknown): style is Style;

export default capstring;
