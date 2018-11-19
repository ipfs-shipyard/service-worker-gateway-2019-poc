'use strict'

const IPFS = require('ipfs')

let node

/* start a IPFS node within the service worker */
const startNode = () => {
  node = new IPFS()
  node.on('error', (error) => {
    console.log(new Error('js-ipfs node errored', error))
  })
}

/* get a ready to use IPFS node */
const getNode = () => {
  if (!node) {
    startNode()
  }

  return new Promise((resolve) => {
    if (node.isOnline()) {
      resolve(node)
    } else {
      node.on('ready', () => {
        if (node.isOnline()) {
          resolve(node)
        }
      })
    }
  })
}

module.exports = {
  get: getNode,
  start: startNode
}
