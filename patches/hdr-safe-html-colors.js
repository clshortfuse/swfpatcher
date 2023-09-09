import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/**
 * @param {number} number
 * @return {string}
 */
function hexString(number) {
  return number.toString(16).padStart(2, '0');
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ raw, mods, global }) {
  let clampedWhite = 0;
  let clampedRGB = 0;
  const replaced = raw
    .replaceAll(
      / color=&quot;#([\da-f]{2})([\da-f]{2})([\da-f]{2})&quot;/gi,
      (match, g1, g2, g3) => {
        const red = Number.parseInt(g1, 16);
        const green = Number.parseInt(g2, 16);
        const blue = Number.parseInt(g3, 16);
        const newRGB = rec709YClamped(red / 255, green / 255, blue / 255, MAX_Y);
        if (newRGB) {
          if (blue === 255 && green === 255 && red === 255) {
            clampedWhite++;
          } else {
            clampedRGB++;
          }
          const reducedRed = hexString(Math.round(newRGB[0] * 255));
          const reducedGreen = hexString(Math.round(newRGB[1] * 255));
          const reducedBlue = hexString(Math.round(newRGB[2] * 255));
          const newValue = ` color=&quot;#${reducedRed}${reducedGreen}${reducedBlue}&quot;`;
          return newValue;
        }
        return match;
      },
    );

  if (clampedWhite || clampedRGB) {
    global.html ??= { white: 0, rgb: 0 };
    global.html.white += clampedWhite;
    global.html.rgb += clampedRGB;

    mods.push(`html: ${clampedWhite} + ${clampedRGB}`);
    return replaced;
  }
  return false;
}
