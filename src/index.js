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
    return
  }

  const regex = /^.+?(\/ipfs\/.+)$/g
  const match = regex.exec(path)
  const ipfsPath = match[1]

  event.respondWith(fetchFile(ipfsPath))
})

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// Activate service worker
self.addEventListener('activate', (event) => {
  node.get().then((ipfs) => {
    ipfsNode = ipfs
  })
  event.waitUntil(self.clients.claim())
})

createProxyServer(() => ipfsNode, {
  addListener: self.addEventListener && self.addEventListener.bind(self),
  removeListener: self.removeEventListener && self.removeEventListener.bind(self),
  postMessage (data) {
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => client.postMessage(data))
    })
  }
})
