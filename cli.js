/*
   ___      ___    _____   ___ _  _
  / __|__ _| _ \__|_   _| |_ _| \| |__ _
 | (__/ _` |  _(_-< | || '_| || .` / _` |
  \___\__,_|_| /__/ |_||_||___|_|\_\__, |
                                   |___/
*/

/**
 * capstring command-line interface.
 *
 * The entry point is `main(argv, io)`, which is pure apart from the injected `io`
 * so it can be tested in-process. `bin/capstring.js` wires it to the real process.
 * @module capstring/cli
 */

import { readFileSync } from 'node:fs';
import capstring, { capstringAll, count, STYLES, isValidStyle } from './index.js';

const { version: VERSION } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const USAGE = `capstring ${VERSION} - CaPiTaLiZe StRiNgS!

Usage:
  capstring <style> [text...]     Transform text (reads stdin when no text is given)
  capstring --all [text...]       Print every style
  capstring --count [text...]     Count words, characters, and spaces
  capstring --list                List style names

Options:
  -a, --all        Print every style
  -c, --count      Count words, characters, and spaces
  -l, --list       List style names, one per line
      --json       JSON output
  -h, --help       Show this help
  -v, --version    Show version
  --               End of options

Examples:
  capstring kebab "Hello World"          # hello-world
  echo "hello world" | capstring title   # Hello World
  capstring --all hi
`;

/**
 * @typedef {Object} CliIO
 * @property {() => Promise<string>} readStdin - Read all of stdin
 * @property {boolean} isTTY - Whether stdin is an interactive terminal
 * @property {(s: string) => void} stdout - Write to stdout
 * @property {(s: string) => void} stderr - Write to stderr
 */

/**
 * Parse CLI arguments
 * @param {string[]} argv - Arguments (without node and script path)
 * @returns {{ all: boolean, count: boolean, list: boolean, json: boolean, help: boolean, version: boolean, style: string|null, text: string[], unknown: string|null }} Parsed flags
 */
const parseArgs = (argv) => {
  const out = { all: false, count: false, list: false, json: false, help: false, version: false, style: null, text: [], unknown: null };
  const positionals = [];
  let optionsDone = false;
  for (const arg of argv) {
    if (!optionsDone && arg === '--') {
      optionsDone = true;
    } else if (!optionsDone && arg.startsWith('-') && arg.length > 1) {
      if (arg === '-a' || arg === '--all') out.all = true;
      else if (arg === '-c' || arg === '--count') out.count = true;
      else if (arg === '-l' || arg === '--list') out.list = true;
      else if (arg === '--json') out.json = true;
      else if (arg === '-h' || arg === '--help') out.help = true;
      else if (arg === '-v' || arg === '--version') out.version = true;
      else out.unknown = out.unknown ?? arg;
    } else {
      positionals.push(arg);
    }
  }
  // Flags may appear anywhere, so only assign positionals once every flag is known
  if (out.all || out.count) {
    out.text = positionals;
  } else {
    [out.style = null, ...out.text] = positionals;
  }
  return out;
};

/**
 * Run the CLI
 * @param {string[]} argv - Arguments (without node and script path)
 * @param {CliIO} io - Process I/O
 * @returns {Promise<number>} Exit code (0 ok, 2 usage error)
 */
export const main = async (argv, io) => {
  const args = parseArgs(argv);

  if (args.help) {
    io.stdout(USAGE);
    return 0;
  }
  if (args.version) {
    io.stdout(`${VERSION}\n`);
    return 0;
  }
  if (args.unknown) {
    io.stderr(`capstring: unknown option "${args.unknown}"\n\n${USAGE}`);
    return 2;
  }
  if (args.list) {
    io.stdout(args.json ? `${JSON.stringify(STYLES)}\n` : `${STYLES.join('\n')}\n`);
    return 0;
  }
  if (!args.all && !args.count && args.style === null) {
    io.stderr(USAGE);
    return 2;
  }
  if (!args.all && !args.count && !isValidStyle(args.style)) {
    io.stderr(`capstring: unknown style "${args.style}". Run 'capstring --list' to see all styles.\n`);
    return 2;
  }

  let text;
  if (args.text.length > 0) {
    text = args.text.join(' ');
  } else if (io.isTTY) {
    io.stderr(USAGE);
    return 2;
  } else {
    text = (await io.readStdin()).replace(/\r?\n$/, '');
  }

  if (args.count) {
    const c = count(text);
    io.stdout(args.json ? `${JSON.stringify(c)}\n` : `words: ${c.words}, chars: ${c.characters}, chars (no spaces): ${c.charactersNoSpaces}, spaces: ${c.spaces}\n`);
    return 0;
  }

  if (args.all) {
    const results = capstringAll(text);
    if (args.json) {
      io.stdout(`${JSON.stringify(results, null, 2)}\n`);
    } else {
      const width = Math.max(...STYLES.map((s) => s.length));
      // One row per style, so line breaks inside a result are shown escaped
      const oneLine = (v) => v.replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
      io.stdout(STYLES.map((s) => `${s.padEnd(width)}  ${oneLine(results[s])}`).join('\n') + '\n');
    }
    return 0;
  }

  const output = capstring(text, args.style);
  io.stdout(args.json ? `${JSON.stringify({ input: text, style: args.style, output })}\n` : `${output}\n`);
  return 0;
};

export default main;
