import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildXML } from '../utils/xml/builder.js';
import { createXMLProxy, parseXMLAsEntries } from '../utils/xml/parser.js';

/**
 * @param {string} command
 * @param  {string[]} [args]
 * @param {import('child_process').SpawnOptions} [options]
 * @return {Promise<string>}
 */
async function waitForProcess(command, args, options) {
  const process = spawn(command, args, options);
  let stdout = '';
  let stderr = '';

  await new Promise((resolve, reject) => {
    process.on('error', reject);
    process.on('exit', resolve);
    process.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    process.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
  });
  if (process.exitCode !== 0) {
    console.warn(command, args, options);
    console.warn(`Exitcode: ${process.exitCode}`);
    console.error(stderr);
    throw new Error(stderr);
  }

  return stdout;
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} stdin
 * @param {import('child_process').SpawnOptions} [options]
 * @return {Promise<string>}
 */
async function waitForPipedProcess(command, args, stdin, options) {
  const process = spawn(command, args, options);
  let stdout = '';
  let stderr = '';

  await new Promise((resolve, reject) => {
    process.stdin.end(stdin);
    process.on('error', reject);
    process.on('exit', resolve);
    process.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    process.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
  });
  if (process.exitCode !== 0) {
    console.warn(command, args, options);
    console.warn(`Exitcode: ${process.exitCode}`);
    console.error(stderr);
    throw new Error(stderr);
  }

  return stdout;
}

const global = {};

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FFDEC_PATH = path.resolve(__dirname, '../utils/ffdec/ffdec.jar');

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {Function} patches
 */
export async function runPatches(inputPath, outputPath, patches) {
  const filename = path.basename(inputPath);

  let raw = await waitForProcess('java', ['-Xmx1G', '-jar', FFDEC_PATH, '-swf2xml', inputPath]);

  let xmlEntries = parseXMLAsEntries(raw);
  let xml = createXMLProxy(['$root', xmlEntries]);
  let modified = false;
  /** @type {string[]} */
  const mods = [];

  for (const [source, patch] of patches) {
    // eslint-disable-next-line no-await-in-loop
    const result = await patch({ raw, xml, filename, mods, global });
    if (!result) continue;
    modified = true;
    if (typeof result === 'string') {
      raw = result;

      xmlEntries = parseXMLAsEntries(raw);
      xml = createXMLProxy(['$root', xmlEntries]);
    } else if (result === xml) {
      // Rebuild raw XML
      raw = buildXML(xmlEntries);
    }
  }

  if (modified) {
    await waitForPipedProcess('java', ['-Xmx1G', '-jar', FFDEC_PATH, '-xml2swf', '/dev/stdin', outputPath], raw);
  }
  // console.log('FINISHED', filename);
  return { raw, xml, filename, mods, global };
}
