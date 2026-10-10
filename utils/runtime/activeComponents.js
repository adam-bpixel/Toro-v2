'use strict';
const claimed = new Set();

module.exports = {
  claim: (messageId) => claimed.add(messageId),
  release: (messageId) => claimed.delete(messageId),
  has: (messageId) => claimed.has(messageId),
};
