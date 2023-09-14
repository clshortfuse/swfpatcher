import { ColorSpace, FillStyleType, ShapeRecordType, TagType } from 'swf-types';

import { linearRGBYClamped, rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {import('swf-types').StraightSRgba8|import('swf-types').SRgb8} color
 * @param {boolean} [linear]
 * @return {number}
 */
function modifyColor(color, linear = false) {
  // Ignore alpha
  const { r, g, b } = color;
  const newRGB = (linear ? linearRGBYClamped : rec709YClamped)(
    (r / 255),
    (g / 255),
    (b / 255),
    MAX_Y,
  );
  if (newRGB) {
    const newRed = Math.floor((newRGB[0] * 255));
    const newGreen = Math.floor((newRGB[1] * 255));
    const newBlue = Math.floor((newRGB[2] * 255));

    if (newRed === r && newGreen === g && newBlue === b) return 0;

    color.r = newRed;
    color.g = newGreen;
    color.b = newBlue;

    return 1;
  }
  return 0;
}

/**
 * @param {import('swf-types/fill-style').FillStyle} fillStyle
 * @return {number}
 */
function modifyFillStyle(fillStyle) {
  let modifiedCount = 0;

  switch (fillStyle.type) {
    case FillStyleType.Solid:
      modifiedCount += modifyColor(fillStyle.color);
      break;
    case FillStyleType.LinearGradient:
    case FillStyleType.RadialGradient:
    case FillStyleType.FocalGradient:
      for (const color of fillStyle.gradient.colors) {
        modifiedCount += modifyColor(color.color, fillStyle.gradient.colorSpace === ColorSpace.LinearRgb);
      }
      break;
    default:
  }
  return modifiedCount;
}

/**
 *
 * @param {import('swf-types/shape-styles').ShapeStyles} shapeStyles
 * @return {number}
 */
function modifyShapeStyles(shapeStyles) {
  let modifiedCount = 0;
  for (const fillStyle of shapeStyles.fill) {
    modifiedCount += modifyFillStyle(fillStyle);
  }
  for (const lineStyle of shapeStyles.line) {
    modifiedCount += modifyFillStyle(lineStyle.fill);
  }
  return modifiedCount;
}

/**
 * @param {import('swf-types/shape').Shape} shape
 */
function modifyShape(shape) {
  let modifiedCount = 0;
  modifiedCount += modifyShapeStyles(shape.initialStyles);
  for (const record of shape.records) {
    if (record.type === ShapeRecordType.StyleChange && record.newStyles) {
      modifiedCount += modifyShapeStyles(record.newStyles);
    }
  }
  return modifiedCount;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ swf, mods }) {
  let modifiedCount = 0;
  for (const tag of swf.tags) {
    switch (tag.type) {
      case TagType.SetBackgroundColor:
        modifiedCount += modifyColor(tag.color);
        break;
      case TagType.DefineShape:
        modifiedCount += modifyShape(tag.shape);
        break;
      case TagType.DefineText:
        for (const record of tag.records) {
          if (record.color) {
            modifiedCount += modifyColor(record.color);
          }
        }
        break;
      case TagType.DefineDynamicText:
        if (tag.color) {
          modifiedCount += modifyColor(tag.color);
        }
        break;
      case TagType.PlaceObject:
        if (tag.backgroundColor) {
          modifiedCount += modifyColor(tag.backgroundColor);
        }
        break;
      default:
    }
  }

  if (!modifiedCount) return false;

  mods.push(`rgb: ${modifiedCount}`);

  return true;
}
