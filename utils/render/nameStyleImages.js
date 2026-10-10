'use strict';
const hosted = require('../../data/name-styles-hosted.json');

const previewUrl = async (file) => hosted[file] || null;

module.exports = { previewUrl };
