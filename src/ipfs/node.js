'use strict'

const IPFS = require('ipfs')

let node

/* start a IPFS node within the service worker */
const startNode = () => {
  node = new IPFS({
    config: {
      Addresses: {
        Swarm: []
      }
    }
  })
  node.on('error', (error) => {
    throw new Error('js-ipfs node errored', error)
  })
}

/* get a ready to use IPFS node */
const getNode = () => {
  if (!node) {
    startNode()
  }

  return new Promise(resolve => {
    if (node.isOnline()) {
      resolve(node)
    } else {
      node.on('ready', () => {
        if (node.isOnline()) {
          console.info('js-ipfs node in the service worker is ready')
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
