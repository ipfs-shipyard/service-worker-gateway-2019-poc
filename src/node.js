'use strict'

const IPFS = require('ipfs')

let node

/* get a ready to use IPFS node */
const getNode = () => {
  if (!node) {
    node = IPFS.create()
  }

  return node
}

exports.get = getNode
