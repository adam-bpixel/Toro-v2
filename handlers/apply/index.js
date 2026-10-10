'use strict';
const applySetup = require('./applySetup');
const applyUI = require('./applyUI');

module.exports = {
  ...applySetup,
  ...applyUI,
};
