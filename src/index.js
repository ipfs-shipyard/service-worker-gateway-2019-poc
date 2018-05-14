/* global self, Response */

'use strict'

const ipfsNode = require('./ipfs/node')

const headers = { status: 200, statusText: 'OK', headers: {} }

/* get the file from ipfs using its hash */
const getFile = async (hash) => {
  try {
    // TODO handle files as in the js-ipfs gateway
    const node = await ipfsNode.get()
    const files = await node.files.get(hash)
    if (files[0].type === 'dir') {
      return new Response(files[1].content, headers)
    }
    return new Response(files[0].content, headers)
  } catch (error) {
    throw new Error('IPFS file not found', error)
  }
}

/* Fecth request */
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith(self.location.origin + '/ipfs')) {
    return console.info(`Fetch not in scope: ${event.request.url}`)
  }

  const multihash = event.request.url.split('/ipfs/')[1]

  console.info(`Service worker trying to get ${multihash}`)
  event.respondWith(getFile(multihash))
})

/* Install service worker */
self.addEventListener('install', (event) => {
  console.info('service worker is being installed')
  event.waitUntil(self.skipWaiting())
})

/* Activate service worker */
self.addEventListener('activate', (event) => {
  console.info('service worker is being activated')
  ipfsNode.start()
  event.waitUntil(self.clients.claim())
})
