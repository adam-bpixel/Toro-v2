'use strict';

// @napi-rs/canvas is a native addon that costs real memory once loaded. Most commands never
// draw anything, so it is required on the first draw instead of at startup.
let canvas;
const lib = () => (canvas ??= require('@napi-rs/canvas'));

module.exports = {
  createCanvas: (...args) => lib().createCanvas(...args),
  loadImage: (...args) => lib().loadImage(...args),
};
