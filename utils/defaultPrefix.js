'use strict';

const defaultPrefix = () => (process.env.DEFAULT_PREFIX || '').trim() || '&';

module.exports = { defaultPrefix };
