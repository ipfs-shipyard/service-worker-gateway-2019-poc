'use strict'

module.exports = function mockWindow () {
  const win = {
    listeners: [],
    addEventListener: (_, listener) => win.listeners.push(listener),
    removeEventListener (_, listener) {
      win.listeners = win.listeners.filter(l => l !== listener)
    }
  }
  return win
}
