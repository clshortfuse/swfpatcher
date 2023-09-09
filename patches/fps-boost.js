const TARGET_FPS = 120;

const DISABLED = true;

/** @type {import("./sample.js").SWFPatch} */
export function run({ raw, xml, filename, mods }) {
  const { swf } = xml;

  const { frameRate } = swf.$attributes;
  const nFrameRate = Number.parseFloat(frameRate);
  if (nFrameRate === TARGET_FPS) return false;

  let unsafe = true;

  for (const tag of swf.tags.$array) {
    const { $attributes: { type, frameCount, spriteId } } = tag;
    if (!frameCount) continue;
    const nFrameCount = Number.parseInt(frameCount, 10);
    if (nFrameCount === 1) continue;

    if (type !== 'DefineSpriteTag') {
      console.warn('Unrecognized multiframe item type', type);
      return false;
    }

    let currentFrame = 1;
    let currentAnimation = { label: '', start: 1, end: 1, count: 1, data: [] };
    const frameMarkerIndexes = [];
    const animations = [currentAnimation];
    const subTagsArray = tag.subTags.$array;
    for (const [index, item] of subTagsArray.entries()) {
      const { type, name } = item.$attributes;
      // eslint-disable-next-line no-shadow
      switch (type) {
        case 'ShowFrameTag':
          currentAnimation.end = currentFrame;
          currentAnimation.count = 1 + currentFrame - currentAnimation.start;
          currentFrame++;
          frameMarkerIndexes.push(index);
          continue;
        case 'FrameLabelTag':
          if (currentFrame === 1) {
            currentAnimation.label = name;
          } else {
            // Start of new animation
            currentAnimation = { label: name, start: currentFrame, data: [] };
            animations.push(currentAnimation);
          }
          continue;
        case 'PlaceObject2Tag':
        case 'PlaceObject3Tag':
        case 'RemoveObject2Tag':
          // currentAnimation.data.push(item);
          continue;
        default:
          console.warn('Unhandled type', type);
      }
    }

    let totalExtraFrames = 0;

    // Precheck if it's safe to bump frame numbers
    const multiFrameAnimations = animations.filter(({ count }) => count > 2);
    if (multiFrameAnimations.length > 1) {
      console.warn('(!!!!!)', filename, 'has', animations.length, 'animations', 'on Sprite #', spriteId);
      unsafe = true;
    }
    for (const animation of multiFrameAnimations.reverse()) {
      if (animation.count === 1) continue;
      if (animation.count === 2) {
        // Assume all two frame animations are toggles, regardless of sequencing;
        // console.debug(filename, 'has a 2-frame animation', `(${animation.label || 'UNLABELLED'})`, 'on Sprite #', spriteId, '(OK)');
        continue;
      }

      // console.debug('(OK)', filename, 'has a', animation.count, 'frame animation', `(${animation.label || 'UNLABELLED'})`, 'on Sprite #', spriteId);

      // Work backwards and inject new frame markers

      // Use any frame marker object to duplicate into array
      const frameMarker = subTagsArray[frameMarkerIndexes[0]];
      for (let index = animation.end; index >= animation.start; index--) {
        for (let extraFrames = 0; extraFrames < (TARGET_FPS / nFrameRate) - 1; extraFrames++) {
          totalExtraFrames++;
          subTagsArray.splice(frameMarkerIndexes[index - 1], 0, frameMarker);
        }
      }
    }

    if (totalExtraFrames) {
      tag.$attributes.frameCount = `${nFrameCount + totalExtraFrames}`;
    }
  }

  if (unsafe) {
    // Passback raw string to undo changes
    return raw;
  }

  swf.$attributes.frameRate = TARGET_FPS.toFixed(1);
  mods.push(`fps: ${TARGET_FPS}`);
  return xml;
}
