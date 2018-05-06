/* eslint-disable no-unused-vars, no-restricted-globals */
/* global self, importScripts */
function require(moduleName) {
  self.module = { exports: null };
  importScripts(moduleName);
  return self.module.exports;
}
