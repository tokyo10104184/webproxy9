/* eslint-disable no-undef */

// Function-based XOR encoding to avoid immediate dependency on Ultraviolet global
const xor = {
  encode(str) {
    if (!str) return str;
    return encodeURIComponent(
      str
        .split('')
        .map((char, ind) =>
          ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char
        )
        .join('')
    );
  },
  decode(str) {
    if (!str) return str;
    let [fixedStr, ...search] = str.split('?');

    return (
      decodeURIComponent(fixedStr)
        .split('')
        .map((char, ind) =>
          ind % 2 ? String.fromCharCode(char.charCodeAt(0) ^ 2) : char
        )
        .join('') + (search.length ? '?' + search.join('?') : '')
    );
  },
};

self.__uv$config = {
  prefix: '/uv/service/',
  bare: '/api/bare/',
  encodeUrl: xor.encode,
  decodeUrl: xor.decode,
  handler: '/uv/uv.handler.js',
  bundle: '/uv/uv.bundle.js',
  config: '/uv/uv.config.js',
  sw: '/uv/uv.sw.js',
};
