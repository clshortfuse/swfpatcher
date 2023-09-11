import { rec709YClamped } from '../utils/color.js';

const MAX_Y = 0.5;

/** @type {import("./sample.js").SWFPatch} */
export function run({ raw, mods, global }) {
  let clampedWhite = 0;
  let clampedRGB = 0;
  const replaced = raw
    .replaceAll(
      / blue="(\d+)" green="(\d+)" red="(\d+)"/gi,
      (match, g1, g2, g3) => {
        const blue = Number.parseInt(g1, 10);
        const green = Number.parseInt(g2, 10);
        const red = Number.parseInt(g3, 10);
        const newRGB = rec709YClamped(red / 255, green / 255, blue / 255, MAX_Y);
        if (newRGB) {
          const reducedRed = Math.floor(newRGB[0] * 255);
          const reducedGreen = Math.floor(newRGB[1] * 255);
          const reducedBlue = Math.floor(newRGB[2] * 255);

          const newValue = ` blue="${reducedBlue}" green="${reducedGreen}" red="${reducedRed}"`;
          if (match === newValue) return match;
          if (blue === 255 && green === 255 && red === 255) {
            clampedWhite++;
          } else {
            clampedRGB++;
          }
          return newValue;
        }
        return match;
      },
    );

  if (clampedWhite || clampedRGB) {
    global.rgb ??= { white: 0, rgb: 0 };
    global.rgb.white += clampedWhite;
    global.rgb.rgb += clampedRGB;

    mods.push(`rgb: ${clampedWhite} + ${clampedRGB}`);
    return replaced;
  }
  return false;
}
