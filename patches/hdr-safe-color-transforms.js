import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {number} v
 * @return {number}
 */
function getNeededBitsS(v) {
  let counter = 32;
  let mask = 0x80_00_00_00;
  const val = (v < 0) ? -v : v;
  // eslint-disable-next-line no-bitwise
  while (((val & mask) === 0) && (counter > 0)) {
    // eslint-disable-next-line no-bitwise
    mask >>>= 1;
    counter -= 1;
  }
  return counter + 1;
}

/**
 *
 * @param {number} currentBitCount
 * @param {number} value
 * @return {number}
 */
function enlargeBitCountS(currentBitCount, value) {
  if (value === 0) {
    return currentBitCount;
  }
  const neededNew = getNeededBitsS(value);
  if (neededNew > currentBitCount) {
    return neededNew;
  }
  return currentBitCount;
}

/**
 * Extremely fragile way to update XML file
 * Use until XML repacking is tested
 * @param {string} tag
 * @param {Object<string, string|number|boolean>} attributes
 * @return {string}
 */
function buildXMLStartTag(tag, attributes) {
  return `<${tag} ${
    Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ')
  }>`;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ raw, xml, filename, mods, global }) {
  const countAll = 0;
  let countClear = 0;
  let countTransparent = 0;
  let countTranslucent = 0;
  let countClamped = 0;
  let countOffset = 0;
  let countMixed = 0;
  let countColorMix = 0;
  let countBlacken = 0;
  let countDarken = 0;
  let countSafeColor = 0;
  /** @type {Map<string,string>} */
  const replacements = new Map();

  const replaced = raw.replaceAll(
    /<colorTransform type="CXFORMWITHALPHA" alphaAddTerm="(\d+)" alphaMultTerm="(\d+)" blueAddTerm="(\d+)" blueMultTerm="(\d+)" greenAddTerm="(\d+)" greenMultTerm="(\d+)" hasAddTerms="(\w+)" hasMultTerms="(\w+)" nbits="(\d+)" redAddTerm="(\d+)" redMultTerm="(\d+)">/g,
    (
      match,
      alphaAddTerm,
      alphaMultTerm,
      blueAddTerm,
      blueMultTerm,
      greenAddTerm,
      greenMultTerm,
      hasAddTerms,
      hasMultTerms,
      nbits,
      redAddTerm,
      redMultTerm,
    ) => {
      if (replacements.has(match)) {
        countClamped++;
        return replacements.get(match);
      }
      const hasOffset = hasAddTerms === 'true';
      const hasMultiplier = hasMultTerms === 'true';
      if (!hasOffset && !hasMultiplier) {
        // Clear transform;
        countClear++;
        return match;
      }
      const alphaMultplier = Number.parseInt(alphaMultTerm, 10) / 256;
      const redMultiplier = Number.parseInt(redMultTerm, 10) / 256;
      const greenMultiplier = Number.parseInt(greenMultTerm, 10) / 256;
      const blueMultiplier = Number.parseInt(blueMultTerm, 10) / 256;
      const alphaOffset = Number.parseInt(alphaAddTerm, 10) / 256;
      const redOffset = Number.parseInt(redAddTerm, 10);
      const greenOffset = Number.parseInt(greenAddTerm, 10);
      const blueOffset = Number.parseInt(blueAddTerm, 10);

      if (hasOffset && hasMultiplier) {
        if (alphaMultplier === 0 && !alphaOffset) {
          countTransparent++;
          return match;
        }
        if (alphaMultplier !== 1 || redMultiplier !== 0 || greenMultiplier !== 0 || blueMultiplier !== 0) {
          countMixed++;
          // Unsupported. Read sprite?
          return match;
        }
        if (alphaOffset !== 0) {
          // console.warn(filename, 'alpha offset?', match);
          countMixed++;
          return match;
        }
        const newRGB = rec709YClamped(
          (redOffset / 255),
          (greenOffset / 255),
          (blueOffset / 255),
          MAX_Y,
        );
        if (!newRGB) {
          countSafeColor++;
          return match;
        }

        countClamped++;
        redAddTerm = Math.round((newRGB[0] * 255));
        greenAddTerm = Math.round((newRGB[1] * 255));
        blueAddTerm = Math.round((newRGB[2] * 255));
        nbits = 1;
        nbits = enlargeBitCountS(nbits, 256); // Alpha
        nbits = enlargeBitCountS(nbits, redAddTerm);
        nbits = enlargeBitCountS(nbits, greenAddTerm);
        nbits = enlargeBitCountS(nbits, blueAddTerm);
        const replacement = `<colorTransform type="CXFORMWITHALPHA" alphaAddTerm="0" alphaMultTerm="256" blueAddTerm="${blueAddTerm}" blueMultTerm="0" greenAddTerm="${greenAddTerm}" greenMultTerm="0" hasAddTerms="true" hasMultTerms="true" nbits="${nbits}" redAddTerm="${redAddTerm}" redMultTerm="0">`;

        replacements.set(match, replacement);
        return replacement;
        // const formatMulti = (mult) => `${Math.round(mult * 10_000) / 100}%`;
        // console.log(
        //   filename,
        //   `[ ${[alphaMultplier, redMultiplier, greenMultiplier, blueMultiplier].map(formatMulti).join(' ')} ]`,
        //   `+ rgb(${[redOffset, greenOffset, blueOffset].join(', ')})`,
        // );
      }

      if (hasMultiplier) {
        if (alphaMultplier === 0 && !hasOffset) {
          countTransparent++;
          return match;
        }
        if (redMultiplier === 1 && greenMultiplier === 1 && blueMultiplier === 1) {
          if (alphaMultplier === 1) {
            console.log('useless transform??', match);
          } else {
            countTranslucent++;
          }
          return match;
        }
        if (redMultiplier === 0 && greenMultiplier === 0 && blueMultiplier === 0) {
          countBlacken++;
          return match;
        }
        if (redMultiplier > 1 || greenMultiplier > 1 || blueMultiplier > 1) {
          countColorMix++;
          console.log('color mix', match);
          return match;
        }
        countDarken++;
        return match;
      }

      if (hasOffset) {
        countOffset++;
        console.log('transform offsets', match);
        return match;
      }
      return match;
    },

  );

  if (!replacements.size) return false;

  mods.push(`cxfrom: ${countClamped}`);

  global.cxfrom ??= { clamped: 0 };
  global.cxfrom.clamped += countClamped;

  return replaced;
}
