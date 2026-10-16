'use strict';

// Flattens several modules into one barrel object, like `{ ...a, ...b }` but safe: when two
// modules export different values under the same name, neither silently wins. Reading that
// name from the barrel throws and says which files to require directly instead.
function mergeExports(modules) {
  const owners = new Map();
  for (const [file, exported] of Object.entries(modules)) {
    for (const [key, value] of Object.entries(exported)) {
      const seen = owners.get(key);
      if (!seen) owners.set(key, { value, files: [file] });
      else if (seen.value !== value) seen.files.push(file);
    }
  }

  const merged = {};
  for (const [key, { value, files }] of owners) {
    if (files.length === 1) {
      merged[key] = value;
      continue;
    }
    Object.defineProperty(merged, key, {
      enumerable: false,
      get() {
        throw new Error(`"${key}" is exported by ${files.join(', ')} - require the one you mean directly`);
      },
    });
  }
  return merged;
}

module.exports = { mergeExports };
