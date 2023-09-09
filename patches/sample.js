/**
 * @typedef {Object} SWFPatchOptions
 * @prop {string} raw
 * @prop {string} inputPath
 * @prop {string} outputPath
 * @prop {string} filename
 * @prop {string[]} mods
 * @prop {Record<string, string>} global
 * @prop {import("../utils/xml/parser.js").XMLProxy<any>} xml
 */

/**
 * @callback SWFPatch
 * @param {SWFPatchOptions} options
 * @return {string|boolean|void|Object|Promise<string|boolean|void|Object>}
 */

/** @type {SWFPatch} */
export function run() {}
