import { TagType } from 'swf-types';

import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {import('swf-types').ColorTransform|import('swf-types').ColorTransformWithAlpha} colorTransform
 * @return {number}
 */
function modifyColorTransform(colorTransform) {
  const alphaMultplier = 'alphaMult' in colorTransform ? colorTransform.alphaMult.valueOf() : 1;
  const alphaOffset = 'alphaAdd' in colorTransform ? colorTransform.alphaAdd.valueOf() : 0;

  const redMultiplier = colorTransform.redMult.valueOf();
  const greenMultiplier = colorTransform.greenMult.valueOf();
  const blueMultiplier = colorTransform.blueMult.valueOf();
  const redOffset = colorTransform.redAdd.valueOf();
  const greenOffset = colorTransform.greenAdd.valueOf();
  const blueOffset = colorTransform.blueAdd.valueOf();

  const hasOffset = alphaOffset || redOffset || greenOffset || blueOffset;
  const hasMultiplier = alphaMultplier !== 1 || redMultiplier !== 1 || greenMultiplier !== 1 || blueMultiplier !== 1;
  if (hasOffset && hasMultiplier) {
    if (alphaMultplier === 0 && !alphaOffset) {
      // Transparent
      return 0;
    }
    if (alphaMultplier !== 1 || redMultiplier !== 0 || greenMultiplier !== 0 || blueMultiplier !== 0) {
      // Mixed
      // Unsupported. Read sprite?
      return 0;
    }
    if (alphaOffset !== 0) {
      // console.warn(filename, 'alpha offset?', match);
      // Mixed;
      return 0;
    }
    const newRGB = rec709YClamped(
      (redOffset / 255),
      (greenOffset / 255),
      (blueOffset / 255),
      MAX_Y,
    );
    if (!newRGB) {
      // HDRSafe
      return 0;
    }

    // countClamped++;
    const redAddTerm = Math.floor((newRGB[0] * 255));
    const greenAddTerm = Math.floor((newRGB[1] * 255));
    const blueAddTerm = Math.floor((newRGB[2] * 255));

    return 1;
    const replacement = `<colorTransform type="CXFORMWITHALPHA" alphaAddTerm="0" alphaMultTerm="256" blueAddTerm="${blueAddTerm}" blueMultTerm="0" greenAddTerm="${greenAddTerm}" greenMultTerm="0" hasAddTerms="true" hasMultTerms="true" nbits="${nbits}" redAddTerm="${redAddTerm}" redMultTerm="0">`;

    if (match === replacement) return match;

    replacements.set(match, replacement);
    return replacement;
    // const formatMulti = (mult) => `${Math.floor(mult * 10_000) / 100}%`;
    // console.log(
    //   filename,
    //   `[ ${[alphaMultplier, redMultiplier, greenMultiplier, blueMultiplier].map(formatMulti).join(' ')} ]`,
    //   `+ rgb(${[redOffset, greenOffset, blueOffset].join(', ')})`,
    // );
  }

  if (hasMultiplier) {
    if (alphaMultplier === 0 && !hasOffset) {
      // transparent
      return 0;
    }
    if (redMultiplier === 1 && greenMultiplier === 1 && blueMultiplier === 1) {
      if (alphaMultplier === 1) {
        console.log('useless transform??', colorTransform);
      } else {
        // Translucent
      }
      return 0;
    }
    if (redMultiplier === 0 && greenMultiplier === 0 && blueMultiplier === 0) {
      // Blacken
      return 0;
    }
    if (redMultiplier > 1 || greenMultiplier > 1 || blueMultiplier > 1) {
      // color mix
      console.log('color mix', colorTransform);
      return 0;
    }
    // Darken
    return 0;
  }

  if (hasOffset) {
    console.log('transform offsets', colorTransform);
    return 0;
  }
  return 0;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ swf, mods, global }) {
  let modifiedCount = 0;
  for (const tag of swf.tags) {
    switch (tag.type) {
      case TagType.PlaceObject:
        if (tag.colorTransform) {
          modifiedCount += modifyColorTransform(tag.colorTransform);
        }
        break;
      default:
    }
  }

  if (!modifiedCount) return false;

  mods.push(`cxform: ${modifiedCount}`);

  return true;
}
