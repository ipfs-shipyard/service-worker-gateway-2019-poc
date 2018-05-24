/* global self */

'use strict'

const { createProxyServer } = require('ipfs-postmsg-proxy')

const ipfsHttpResponse = require('ipfs-http-response')
const node = require('./node')

let ipfsNode

const fetchFile = (ipfsPath) => {
  return new Promise((resolve, reject) => {
    node.get()
      .then((ipfsNode) => ipfsHttpResponse(ipfsNode, ipfsPath))
      .then((resp) => resolve(resp))
      .catch((err) => reject(err))
  })
}

// Fetch request
self.addEventListener('fetch', (event) => {
  const path = event.request.url

  if (!path.startsWith(self.location.origin + '/ipfs')) {
    return console.info(`Fetch not in scope: ${path}`)
  }

  const regex = /^.+?(\/ipfs\/.+)$/g
  const match = regex.exec(path)
  const ipfsPath = match[1]

  console.info(`Service worker trying to get ${ipfsPath}`)
  event.respondWith(fetchFile(ipfsPath))
})

// Install service worker
self.addEventListener('install', (event) => {
  console.info('service worker is being installed')
  event.waitUntil(self.skipWaiting())
})

// Activate service worker
self.addEventListener('activate', (event) => {
  console.info('service worker is being activated')
  node.get().then((ipfs) => {
    ipfsNode = ipfs
  })
  event.waitUntil(self.clients.claim())
})

createProxyServer(() => ipfsNode, {
  addListener: self.addEventListener && self.addEventListener.bind(self),
  removeListener: self.removeEventListener && self.removeEventListener.bind(self),
  async postMessage (data) {
    // TODO: post back to the client that sent the message?
    const clients = await self.clients.matchAll()
    clients.forEach(client => client.postMessage(data))
  }
})
