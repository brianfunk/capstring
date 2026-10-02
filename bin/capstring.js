#!/usr/bin/env node
import { main } from '../cli.js';

const readStdin = async () => {
  process.stdin.setEncoding('utf8');
  let data = '';
  for await (const chunk of process.stdin) data += chunk;
  return data;
};

process.exitCode = await main(process.argv.slice(2), {
  readStdin,
  isTTY: Boolean(process.stdin.isTTY),
  stdout: (s) => process.stdout.write(s),
  stderr: (s) => process.stderr.write(s)
});
