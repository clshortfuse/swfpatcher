#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { stderr } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { runPatches } from '../lib/patcher.js';
import { getSearchParams } from '../utils/cli.js';
import { waitForTask } from '../utils/tasks.js';

const searchParams = getSearchParams();

// eslint-disable-next-line prefer-const
const inputPath = searchParams.get('in');
const outputPath = searchParams.get('out');
let patchesPath = searchParams.get('patches');
const writeXML = searchParams.has('xml');

if (!inputPath || !outputPath) {
  stderr.end('patch --in=INPUTPATH --out=OUTPUTPATH [--patches=patchPath] [--xml]');
  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
patchesPath ||= path.resolve(__dirname, '../patches');

const inputDirectory = fs.lstatSync(inputPath).isDirectory();
const outputDirectory = fs.lstatSync(outputPath).isDirectory();

/** @return {string[]} */
function getFilenamesFromPath() {
  if (inputDirectory) {
    return fs.readdirSync(inputPath)
      .map((filename) => path.resolve(path.join(inputPath, filename)));
  }
  return [path.resolve(inputPath)];
}

/** @return {Promise<Map<string, import('../patches/sample.js').SWFPatch>>} */
async function collectPatches() {
  /** @type {[string, Function][]} */
  const entries = [];

  const filenames = await fs.promises.readdir(patchesPath);
  await Promise.all(filenames.map(async (filename) => {
    if (!filename.endsWith('.js')) return;
    const { run } = await import(pathToFileURL(path.join(patchesPath, filename)).toString());
    entries.push([filename, run]);
  }));
  return new Map(entries.sort(([fileA], [fileB]) => fileA.localeCompare(fileB)));
}

let modsApplied = 0;
await Promise.all(getFilenamesFromPath().map(async (filename) => {
  // Do sync to keep balanced unpack => repack flow.
  // Queueing all unpacking at once will keep unpacked contents in memory
  const basename = path.basename(filename);
  if (!basename.endsWith('.swf') && !basename.endsWith('.gfx')) return;
  if (basename.startsWith('fonts')) return;

  // eslint-disable-next-line no-await-in-loop

  const resolvedOutputPath = outputDirectory
    ? path.resolve(path.join(outputPath, inputDirectory
      ? path.relative(inputPath, filename)
      : path.basename(filename)))
    : outputPath;
  const { mods, raw } = await waitForTask(
    async () => await runPatches(
      filename,
      resolvedOutputPath,
      await collectPatches(),
    ),
  );
  if (writeXML) {
    await fs.promises.writeFile(`${resolvedOutputPath}.xml`, raw);
  }
  if (mods.length) {
    console.log('Modded', filename, `(${mods.join(', ')})`);
    modsApplied++;
  } else {
    console.log('Skipped', filename);
  }
}));

console.log(modsApplied, `file${modsApplied === 1 ? '' : 's'} written.`);
