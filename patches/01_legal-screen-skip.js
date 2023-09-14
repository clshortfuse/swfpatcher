import { TagType } from 'swf-types';

/** @type {import("./sample.js").SWFPatch} */
export function run({ filename, swf, mods }) {
  if (filename !== 'mainmenu.swf') return false;

  const sprite = /** @type {import('swf-types/tags').DefineSprite} */ (swf.tags
    .find((tag) => (tag.type === TagType.DefineSprite)
      && (tag.id === 49)
      && (tag.frameCount === 175)));
  if (!sprite) return false;

  let currentFrame = 0;
  let insertIndex = -1;
  let removeIndex = -1;
  /** @type {import('swf-types/tags').FrameLabel} */
  let rollOnMarker;

  for (const [index, entry] of sprite.tags.entries()) {
    switch (entry.type) {
      case TagType.ShowFrame:
        currentFrame++;
        if (currentFrame === 172) {
          insertIndex = index;
        }
        break;
      case TagType.FrameLabel:
        if (entry.name === 'rollOn') {
          if (currentFrame === 171) {
            // Already in position, nothing to do;
            return false;
          }
          removeIndex = index;
          rollOnMarker = entry;
        }
        break;
      default:
    }
    if (insertIndex !== -1 && removeIndex !== -1) break;
  }
  if (insertIndex === -1 || removeIndex === -1) return false;
  if (insertIndex < removeIndex) return false;

  // Duplicate into insert position
  sprite.tags.splice(insertIndex, 0, rollOnMarker);
  // Remove from old;
  sprite.tags.splice(removeIndex, 1);

  mods.push('legal-skip: 1');
  return true;
}
