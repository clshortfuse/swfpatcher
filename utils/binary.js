/* eslint-disable no-bitwise */

/**
 * @param {number} number
 * @return {string}
 */
export function numberAsHex(number) {
  return number.toString(16).padStart(2, '0');
}
/**
 * @param {number} number
 * @return {string}
 */
export function numberToU32Hex(number) {
  let hex = '';

  while (number >= 0b100_0000) {
    // Take last 7 bits of number and shift
    hex += numberAsHex((0b0111_1111 & number) | (0b1000_0000));
    number >>= 7;
  }
  return hex + numberAsHex(number);
}

/**
 * @param {number} number
 * @return {string}
 */
export function numberToU30Hex(number) {
  return numberToU32Hex(number & 0x3F_FF_FF_FF);
}
