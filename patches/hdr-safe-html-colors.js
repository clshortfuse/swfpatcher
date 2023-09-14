import { TagType } from 'swf-types';

import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {number} number
 * @return {string}
 */
function hexString(number) {
  return number.toString(16).padStart(2, '0');
}

/**
 * @param {import('swf-types/tags').DefineDynamicText} defineDynamicText
 * @return {number}
 */
function modifyDefinteDynamicText(defineDynamicText) {
  let modifiedCount = 0;
  if (!defineDynamicText.html) return 0;
  const replaced = defineDynamicText.text
    .replaceAll(
      / color="#([\da-f]{2})([\da-f]{2})([\da-f]{2})"/gi,
      (match, g1, g2, g3) => {
        const red = Number.parseInt(g1, 16);
        const green = Number.parseInt(g2, 16);
        const blue = Number.parseInt(g3, 16);
        const newRGB = rec709YClamped(red / 255, green / 255, blue / 255, MAX_Y);
        if (newRGB) {
          const reducedRed = hexString(Math.floor(newRGB[0] * 255));
          const reducedGreen = hexString(Math.floor(newRGB[1] * 255));
          const reducedBlue = hexString(Math.floor(newRGB[2] * 255));
          const newValue = ` color="#${reducedRed}${reducedGreen}${reducedBlue}"`;
          if (match === newValue) return match;

          modifiedCount++;
          return newValue;
        }
        return match;
      },
    );
  if (modifiedCount) {
    defineDynamicText.text = replaced;
  }
  return modifiedCount;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ swf, mods, global }) {
  let modifiedCount = 0;
  for (const tag of swf.tags) {
    switch (tag.type) {
      case TagType.DefineDynamicText:
        modifiedCount += modifyDefinteDynamicText(tag);
        break;
      case TagType.PlaceObject:
        break;
      default:
    }
  }

  if (!modifiedCount) return false;

  mods.push(`rgb: ${modifiedCount}`);

  return true;
}
