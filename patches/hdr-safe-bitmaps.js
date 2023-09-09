import { Buffer } from 'node:buffer';
import { deflateSync, inflateSync } from 'node:zlib';

import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @callback TagProcessor
 * @param {import('../utils/xml/parser.js').XMLProxy<never, 'zlibBitmapData' | 'bitmapFormat' | 'bitmapHeight' | 'bitmapWidth' | 'bitmapColorTableSize'} tag
 * @return {void|boolean}
 */

/** @type {TagProcessor} */
function processDefineBitsJPEG2Tag(tag) {
  console.warn('(!) DefineBitsJPEG2Tag not supported.');
}

/** @type {TagProcessor} */
function processDefineBitsJPEG3Tag(tag) {
  console.warn('(!) DefineBitsJPEG3Tag not supported.');
}

/** @type {TagProcessor} */
function processDefineBitsJPEG4Tag(tag) {
  console.warn('(!) DefineBitsJPEG4Tag not supported.');
}

/** @type {TagProcessor} */
function processDefineBits(tag) {
  console.warn('(!) DefineBits not supported.');
}

/** @type {TagProcessor} */
function processDefineBitsLosslessTag(tag) {
  const { zlibBitmapData, bitmapFormat, bitmapHeight, bitmapWidth, bitmapColorTableSize } = tag.$attributes;

  // Don't trust JPEXS the bitmapFormat
  // Compute manually based on width, height and filelength

  if (bitmapFormat !== '5') {
    console.warn('(!) BitmapFormat not supported', bitmapFormat);
    return false;
  }
  if (bitmapColorTableSize !== '0') {
    console.warn('(!) Bitmap color table not supported', bitmapFormat);
    return false;
  }

  // Assume no color table;
  const zlibBuffer = Buffer.from(zlibBitmapData, 'hex');

  let pixelsChanged = 0;
  const inflated = inflateSync(zlibBuffer);

  const pixelCount = Number.parseInt(bitmapHeight, 10) * Number.parseInt(bitmapWidth, 10);
  const bitsPerPixel = inflated.length / pixelCount;

  for (let index = 0; index < pixelCount; index++) {
    let offset = index * bitsPerPixel;
    // R8 G8 B8
    const alpha = bitsPerPixel === 4 ? inflated[offset++] / 255 : 1;
    const red = (inflated[offset] / 255) * alpha;
    const green = (inflated[offset + 1] / 255) * alpha;
    const blue = (inflated[offset + 2] / 255) * alpha;

    const newRGB = rec709YClamped(red, green, blue, MAX_Y);

    // const y8 = y * 255;
    if (newRGB) {
      inflated[offset] = Math.round((newRGB[0] * 255) / alpha);
      inflated[offset + 1] = Math.round((newRGB[1] * 255) / alpha);
      inflated[offset + 2] = Math.round((newRGB[2] * 255) / alpha);
      pixelsChanged++;
    }
    /* eslint-enable no-bitwise */
  }

  if (pixelsChanged) {
    const deflated = deflateSync(inflated).toString('hex');
    // Overrwrite attribute
    tag.$attributes.zlibBitmapData = deflated;
    return true;
  }
  return false;
}

/** @type {TagProcessor} */
function processDefineBitsLossless2Tag(tag) {
  return processDefineBitsLosslessTag(tag); // No difference
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ raw, xml, mods, global }) {
  const { swf } = xml;

  let modifiedCount = 0;

  for (const child of swf.tags) {
    if (child.$tag !== 'item') continue;
    const { type } = child.$attributes;
    let processor;
    switch (type) {
      case 'DefineBitsJPEG2Tag': processor = processDefineBitsJPEG2Tag; break;
      case 'DefineBitsJPEG3Tag': processor = processDefineBitsJPEG3Tag; break;
      case 'DefineBitsJPEG4Tag': processor = processDefineBitsJPEG4Tag; break;
      case 'DefineBits': processor = processDefineBits; break;
      case 'DefineBitsLosslessTag': processor = processDefineBitsLosslessTag; break;
      case 'DefineBitsLossless2Tag': processor = processDefineBitsLossless2Tag; break;
      default:
        continue;
    }
    const result = processor(child);
    if (result) {
      modifiedCount++;
    }
  }
  if (!modifiedCount) return false;
  mods.push(`bmp: ${modifiedCount}`);
  global.bmp ??= { bitmaps: 0 };
  global.bmp.bitmaps += modifiedCount;

  return xml;
}
