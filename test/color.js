import { rec709YClamped } from '../utils/color.js';

let red = 180;
let green = 201;
let blue = 210;

const result = rec709YClamped(red / 255, green / 255, blue / 255, 0.5);

console.log(result.map((n) => Math.floor(n * 255)));
