/**
 * @typedef {Object} SWFPatchOptions
 * @prop {import('swf-types').Movie} swf
 * @prop {string} inputPath
 * @prop {string} outputPath
 * @prop {string} filename
 * @prop {string[]} mods
 * @prop {Record<string, string>} global
 */

/**
 * @callback SWFPatch
 * @param {SWFPatchOptions} options
 * @return {string|boolean|void|Object|Promise<string|boolean|void|Object>}
 */

/** @type {SWFPatch} */
export function run() {}
