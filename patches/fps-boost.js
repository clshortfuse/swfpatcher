import { Ufixed8P8 } from 'swf-types';

import { hexFromNumber, u30HexFromNumber, u32HexFromNumber } from '../utils/binary.js';

const TARGET_FPS = 60;

/** @type {import("./sample.js").SWFPatch} */
function injectExtraFrames({ xml }) {
  const { swf } = xml;

  const { frameRate } = swf.$attributes;
  const nFrameRate = Number.parseFloat(frameRate);
  if (nFrameRate === TARGET_FPS) return false;

  const symbolClass = swf.tags.$array.find((tag) => tag.$attributes.type === 'SymbolClassTag');
  if (!symbolClass) return false;

  let grandTotalExtraFrames = 0;
  const symbolKeys = symbolClass.tags.$array
    .filter((item) => item.$tag === 'item')
    .map((item) => item.$text);
  const symbolValues = symbolClass.names.$array
    .filter((item) => item.$tag === 'item')
    .map((item) => item.$text);

  const symbolMap = new Map(symbolKeys.map((key, index) => [key, symbolValues[index]]));

  let unsafe = false;

  /** @type {Map<string, Map<number,number>>} */
  const remappedFrames = new Map();

  for (const tag of swf.tags.$array) {
    const { $attributes: { type, frameCount, spriteId } } = tag;
    if (!frameCount) continue;
    const nFrameCount = Number.parseInt(frameCount, 10);
    if (nFrameCount === 1) continue;

    if (type !== 'DefineSpriteTag') {
      console.warn('Unrecognized multiframe item type', type);
      return false;
    }

    const spriteName = symbolMap.get(spriteId);

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

    // 838
    let totalExtraFrames = 0;

    const multiFrameAnimations = animations.filter(({ count }) => count > 2);

    const newFrames = (TARGET_FPS / nFrameRate) - 1;
    const injectionLocations = [];
    for (const animation of multiFrameAnimations) {
      if (animation.count === 1) continue;
      if (animation.count === 2) {
        // Assume all two frame animations are toggles, regardless of sequencing;
        // console.debug(filename, 'has a 2-frame animation', `(${animation.label || 'UNLABELLED'})`, 'on Sprite #', spriteId, '(OK)');
        continue;
      }

      // console.debug('(OK)', filename, 'has a', animation.count, 'frame animation', `(${animation.label || 'UNLABELLED'})`, 'on Sprite #', spriteId, `(${spriteName})`);

      // Work backwards and inject new frame markers

      // Use any frame marker object to duplicate into array
      const frameMarker = subTagsArray[frameMarkerIndexes[0]];
      for (let index = animation.start; index <= animation.end; index++) {
        injectionLocations.push(index);
        for (let extraFrames = 0; extraFrames < newFrames; extraFrames++) {
          subTagsArray.splice(frameMarkerIndexes[index - 1] + totalExtraFrames, 0, frameMarker);
        }
        totalExtraFrames += newFrames;
      }
    }

    if (!totalExtraFrames) continue;

    grandTotalExtraFrames += totalExtraFrames;
    if (!spriteName) {
      console.warn(filename, 'no sprite name on', spriteId);
      continue;
    }

    let newFrameCount = 0;
    let nextInjection = injectionLocations.shift();
    for (let i = nextInjection + 1; i < nFrameCount; i++) {
      if (i === nextInjection + 1) {
        newFrameCount += newFrames;
        nextInjection = injectionLocations.shift();
      }

      const oldFrame = i;
      const newFrame = oldFrame + newFrameCount;
      // console.log(filename, 'remapped', oldFrame, '=>', newFrame);
      if (remappedFrames.has(spriteName)) {
        remappedFrames.get(spriteName).set(oldFrame, newFrame);
      } else {
        remappedFrames.set(spriteName, new Map([[oldFrame, newFrame]]));
      }
    }

    if (totalExtraFrames) {
      tag.$attributes.frameCount = `${nFrameCount + totalExtraFrames}`;
    }
  }

  const doAbc = swf.tags.$array.find((tag) => tag.$attributes.type === 'DoABC2Tag');
  const doAbcConstants = doAbc.abc.constants;
  const constantStrings = [...doAbcConstants.constant_string].map((item) => item.$text);
  const namespaces = [...doAbcConstants.constant_namespace].map(({ $attributes }) => {
    if ($attributes.isNull === 'true') return null;
    return { kind: $attributes.kind, name: constantStrings[$attributes.name_index] };
  });
  const namespaceSets = [...doAbcConstants.constant_namespace_set].map((item) => {
    if (item.$attributes.isNull === 'true') return null;
    return [...item.namespaces].map((namespace) => namespaces[namespace.$text]);
  });
  const multinames = [];
  // 0x3FFFFFFF
  for (const { $attributes } of doAbcConstants.constant_multiname) {
    if ($attributes.isNull === 'true') {
      multinames.push(null);
      continue;
    }
    const { kind, name_index, namespace_index, namespace_set_index, qname_index } = $attributes;
    multinames.push({
      kind,
      name: constantStrings[name_index],
      namespace: namespaces[namespace_index],
      namespaceSet: namespaceSets[namespace_set_index],
      qname_index: multinames[qname_index],
    });
  }
  const methodInfos = [...doAbc.abc.method_info].map((methodInfo) => {
    const { flags, name_index, ret_type } = methodInfo.$attributes;
    const paramTypes = [...methodInfo.param_types].map((child) => multinames[child.$text]);
    const paramNames = [...methodInfo.paramNames].map((child) => multinames[child.$text]);
    const params = paramNames.map((name, index) => ({ name, type: paramTypes[index] }));
    return {
      name: constantStrings[name_index],
      returnType: multinames[ret_type],
      params,
    };
  });

  const instanceInfos = [...doAbc.abc.instance_info].map((instanceInfo) => {
    const { flags, iinit_index, name_index, protectedNS, super_index } = instanceInfo.$attributes;
    return {
      init: methodInfos[iinit_index],
      name: multinames[name_index],
      namespace: namespaces[protectedNS],
      super: multinames[super_index],
    };
  });

  for (const body of doAbc.abc.bodies) {
    const { codeBytes, method_info } = body.$attributes;
    methodInfos[method_info].codeBytes = codeBytes;
    methodInfos[method_info].body = body;
  }

  // <item type="MethodBody"
  //   codeBytes="d030d049005dee0e2400d066ed03241dd066ee03242cd066ef034fee0e065d324a32008032d5d1606f66a1096161d12cb6086162d066dc03d14fbc0401d066dc032661d806d066de0320131a0000d066de03240161a9055d810260df0366fb0bd066ea034f810202d04fe7030047"
  //   init_scope_depth="10" max_regs="2" max_scope_depth="11" max_stack="7" method_info="587">
  //   <exceptions></exceptions>
  //   <traits type="Traits">
  //     <traits></traits>
  //   </traits>
  // </item>

  unsafe = false;
  const addFrameScriptIndex = multinames.findIndex((mn) => mn?.name === 'addFrameScript');
  for (const [name, remapping] of remappedFrames) {
    if (!name) {
      console.warn('no name remapping?', name);
      unsafe = true;
      continue;
    }
    /** @type {string} */
    const init = instanceInfos.find((ii) => ii?.namespace?.name === name.replace('.', ':'))?.init;
    if (!init?.codeBytes) {
      console.warn(filename, 'instance not found', name);
      unsafe = true;
      continue;
    }
    /** @type {string} */
    let codeBytes = init.codeBytes;
    // console.log(filename, 'check for addFrameScript');
    const addFrameScriptPCode = `5d${u32HexFromNumber(addFrameScriptIndex)}`;
    const indexOfPCode = codeBytes.indexOf(addFrameScriptPCode);
    if (indexOfPCode === -1) {
      console.warn(filename, 'pcode not in file', name);
      // unsafe = true;
      continue;
    }
    // console.log(filename, 'found', codeBytes);
    // for (const [oldFrame, newFrame] of remapping) {
    //   console.log(filename, 'change actionscript to use', newFrame, 'instead of', oldFrame, 'for', name);
    // }
    for (let i = indexOfPCode + addFrameScriptPCode.length; i < codeBytes.length; i += 2) {
      const hex = codeBytes.slice(i, i + 2);
      if (hex === '24') {
        i += 2;
        const frameNumber = Number.parseInt(codeBytes.slice(i, i + 2), 16);
        if (remapping.has(frameNumber)) {
          const newFrameNumber = remapping.get(frameNumber);
          codeBytes = (newFrameNumber >= 0b1000_0000)
            ? `${codeBytes.slice(0, i - 2)}25${u30HexFromNumber(newFrameNumber)}${codeBytes.slice(i + 2)}`
            : codeBytes.slice(0, i) + hexFromNumber(newFrameNumber) + codeBytes.slice(i + 2);
          // console.log(filename, 'remapped', frameNumber, '=>', newFrameNumber);
        } else {
          // console.log(filename, 'ignoring', frameNumber);
        }
        continue;
      }
      if (hex === '25') {
        i += 2;
        const frameNumber = Number.parseInt(codeBytes.slice(i, i + 2), 16);
        if (remapping.has(frameNumber)) {
          const newFrameNumber = remapping.get(frameNumber);
          codeBytes = `${codeBytes.slice(0, i)}${u30HexFromNumber(newFrameNumber)}${codeBytes.slice(i + 4)}`;
          // console.log(filename, 'remapped', frameNumber, '=>', newFrameNumber);
        } else {
          // console.log(filename, 'ignoring', frameNumber);
        }
        i += 2;
        continue;
      }
      if (hex === 'd0') continue;
      if (hex === '66') {
        let number = 0;
        do {
          i += 2;
          number = Number.parseInt(codeBytes.slice(i, i + 2), 16);
        // eslint-disable-next-line no-bitwise
        } while ((number & 0b1000_0000) !== 0);
        continue;
      }
      if (hex === '4f') break;
    }
    init.body.$attributes.codeBytes = codeBytes;
  }
  return xml;
}

/** @type {import("./sample.js").SWFPatch} */
export function run({ swf, mods }) {
  if (swf.header.frameRate.valueOf() === TARGET_FPS) return false;

  swf.header.frameRate = Ufixed8P8.fromValue(TARGET_FPS);

  mods.push(`fps: ${TARGET_FPS}`);
  return true;
}
