import { deflate } from 'pako/lib/deflate.js';
import { inflate } from 'pako/lib/inflate.js';
import { TagType } from 'swf-types';

import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {import('swf-types/tags').DefineBitmap} tag
 * @return {number}
 */
function processBitmap(tag) {
  // Don't trust JPEXS the bitmapFormat
  // Compute manually based on width, height and filelength

  if (tag.mediaType !== 'image/x-swf-lossless1' && tag.mediaType !== 'image/x-swf-lossless2') {
    console.warn('(!) mediaType not supported', tag.mediaType);
    return 0;
  }

  let pixelsChanged = 0;

  const pixelCount = tag.height * tag.width;
  const inflated = inflate(tag.data.subarray(5));
  const bytesPerPixel = inflated.length / pixelCount;

  for (let index = 0; index < pixelCount; index++) {
    let offset = index * bytesPerPixel;
    // R8 G8 B8
    const alpha = bytesPerPixel === 4 ? inflated[offset++] / 255 : 1;
    const red = inflated[offset];
    const green = inflated[offset + 1];
    const blue = inflated[offset + 2];

    const newRGB = rec709YClamped(
      (red / 255) * alpha,
      (green / 255) * alpha,
      (blue / 255) * alpha,
      MAX_Y,
    );

    // const y8 = y * 255;
    if (newRGB) {
      const newRed = Math.floor((newRGB[0] * 255) / alpha);
      const newGreen = Math.floor((newRGB[1] * 255) / alpha);
      const newBlue = Math.floor((newRGB[2] * 255) / alpha);
      if (newRed === red && newGreen === green && newBlue === blue) continue;
      inflated[offset] = newRed;
      inflated[offset + 1] = newGreen;
      inflated[offset + 2] = newBlue;

      pixelsChanged++;
    }
    /* eslint-enable no-bitwise */
  }

  if (pixelsChanged) {
    const deflated = deflate(inflated);
    tag.data = [
      ...tag.data.slice(0, 5),
      deflated,
    ];
  }
  return pixelsChanged;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ swf, mods, global }) {
  let modifiedCount = 0;

  for (const tag of swf.tags) {
    switch (tag.type) {
      // case TagType.DefineJpegTables: processor = processDefineBitsJPEG2Tag; break;
      case TagType.DefineBitmap:
        modifiedCount += processBitmap(tag); break;
      default:
        continue;
    }
  }
  if (!modifiedCount) return false;
  mods.push(`bmp: ${modifiedCount}`);
  global.bmp ??= { bitmaps: 0 };
  global.bmp.bitmaps += modifiedCount;

  return true;
}
