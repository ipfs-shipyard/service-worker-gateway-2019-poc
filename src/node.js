'use strict'

const IPFS = require('ipfs')

let node

/* start a IPFS node within the service worker */
const startNode = () => {
  return new Promise((resolve) => {
    node = new IPFS()
    node.on('error', (error) => {
      console.log(error.toString())
    })

    node.on('ready', () => {
      resolve(node)
    })
  })
}

/* get a ready to use IPFS node */
const getNode = () => {
  return new Promise((resolve) => {
    if (!node) {
      return startNode().then((node) => resolve(node))
    }

    resolve(node)
  })
}

module.exports = {
  get: getNode,
  start: startNode
}
