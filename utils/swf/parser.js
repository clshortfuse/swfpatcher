import { deflate } from 'pako/lib/deflate.js';
import { inflate } from 'pako/lib/inflate.js';

import BinaryConsumer from '../BinaryConsumer.js';
import { utf8FromUint8Array } from '../binary.js';

/**
 * @typedef {Object} BinaryOffset
 * @prop {number} byte
 * @prop {number} bit
 * @prop
 */

/**
 * @typedef {Object} SWFObject
 * @prop
 */

/**
 * @param {BinaryConsumer} consumer
 */
function decodeRect(consumer) {
  const bitCount = consumer.readBits(5);
  const rect = {
    xMin: consumer.readBits(bitCount),
    xMax: consumer.readBits(bitCount),
    yMin: consumer.readBits(bitCount),
    yMax: consumer.readBits(bitCount),
  };
  consumer.discardBits();
  return rect;
}

/**
 *
 * @param {Uint8Array} uint8Array
 */
export function parseRaw(uint8Array) {
  const consumer = new BinaryConsumer(uint8Array, true);
  const signature = [...utf8FromUint8Array(consumer.readBytes(3))].reverse().join('');
  const version = consumer.read();
  const fileSize = consumer.readUint32();
  const displayRect = decodeRect(consumer);
  const frameRate = consumer.readInt16() / (256);
  const frameCount = consumer.readUint16();
  return {
    signature,
    version,
    fileSize,
    displayRect,
    frameRate,
    frameCount,
  };
}

/**
 *
 * @param {Uint8Array} uint8Array
 * @return {SWFObject}
 */
export function parseSWC(uint8Array) {
  const fileLength = new DataView(uint8Array.buffer).getUint32(4, true);
  const swf = new Uint8Array([
    'F'.charCodeAt(0),
    'W'.charCodeAt(0),
    'S'.charCodeAt(0),
    uint8Array[3],
    ...uint8Array.subarray(4, 8),
    ...inflate(uint8Array.subarray(8)),
  ]);
  if (swf.length !== fileLength) {
    console.warn('Lenth mismatch', fileLength, swf.length);
  }
  console.log('inflated zlib', swf);
  return parseSWF(swf);
}

/**
 *
 * @param {Uint8Array} uint8Array
 */
export function parseSWF(uint8Array) {
  const signature = [...utf8FromUint8Array(uint8Array, 0, 3)].reverse().join('');

  switch (signature) {
    case 'SWC':
      return parseSWC(uint8Array);
    case 'SWF':
      return parseRaw(uint8Array);
    default:
      throw new Error(`Unsupported type: ${signature}`);
  }
}
