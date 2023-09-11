/**
 * @param {string} raw
 * @return {string|boolean}
 */
function removeLegalScreenViaRaw(raw) {
  const spriteIndex = raw.indexOf('<item type="DefineSpriteTag" forceWriteAsLong="true" frameCount="175" hasEndTag="true" spriteId="49">');
  if (spriteIndex === -1) return false;

  const FRAME_MARKER = '<item type="ShowFrameTag"></item>';
  const ROLL_ON_LABEL = '<item type="FrameLabelTag" forceWriteAsLong="true" name="rollOn" namedAnchor="false"></item>';

  const rollOnLabelIndex = raw.indexOf(ROLL_ON_LABEL, spriteIndex);
  let frameMarkerIndex = spriteIndex;
  // Iterate until we are at end of frame 171
  // Frames are denoted at end of options
  for (let i = 1; i < 171; i++) {
    frameMarkerIndex = raw.indexOf(FRAME_MARKER, frameMarkerIndex + 1);
  }
  if (frameMarkerIndex === -1) return false;
  // We should have passed the roll on marker;
  if (rollOnLabelIndex === -1) return false;
  // Roll On Label already exists or belongs to other Sprite
  if (rollOnLabelIndex > frameMarkerIndex) return false;

  const rollOnLabelEnd = rollOnLabelIndex + ROLL_ON_LABEL.length;
  const frameMarkerEnd = frameMarkerIndex + FRAME_MARKER.length;
  // Insert new label after marker and remove old label
  const replaced = raw.slice(0, rollOnLabelIndex)
   + raw.slice(rollOnLabelEnd, frameMarkerEnd)
   + ROLL_ON_LABEL
   + raw.slice(frameMarkerEnd);

  return replaced;
}

/**
 * @param {import("../utils/xml/parser.js").XMLProxy<any>} xml
 * @return {import("../utils/xml/parser.js").XMLProxy<any>|boolean}
 */
function removeLegalScreenViaXML(xml) {
  const { swf } = xml;

  const sprite = swf.tags.$array
    .find(({ $attributes: { type, spriteId } }) => (type === 'DefineSpriteTag' && spriteId === '49'));

  if (!sprite) return false;

  let currentFrame = 0;
  let insertIndex = -1;
  let removeIndex = -1;
  let rollOnMarker;

  const subTagsArray = sprite.subTags.$array;
  for (const [index, entry] of subTagsArray.entries()) {
    const { $attributes: { type, name } } = entry;
    switch (type) {
      case 'ShowFrameTag':
        currentFrame++;
        if (currentFrame === 172) {
          insertIndex = index;
        }
        break;
      case 'FrameLabelTag':
        if (name === 'rollOn') {
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
  subTagsArray.splice(insertIndex, 0, rollOnMarker);
  // Remove from old;
  subTagsArray.splice(removeIndex, 1);
  return xml;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ filename, xml, mods }) {
  if (filename !== 'mainmenu.swf') return false;

  const result = removeLegalScreenViaXML(xml);
  if (!result) return false;
  mods.push('legal-skip: 1');
  return result;
}
