/* global self, Response */

'use strict'

const { createProxyServer } = require('ipfs-postmsg-proxy')

const ipfsHttpResponse = require('ipfs-http-response')
const node = require('./node')
const statsView = require('./stats-view')

let ipfsNode
const fetchedCIDs = []
let startDateTime = {
  date: '',
  time: ''
}

// Fetch CID
const fetchCID = (ipfsPath) => {
  return node.get()
    .then((ipfsNode) => ipfsHttpResponse(ipfsNode, ipfsPath))
    .then((resp) => {
      // Keep a record of the fetched CID (and fetch date)
      const d = new Date()
      fetchedCIDs.push({
        cid: ipfsPath.split('/ipfs/')[1],
        date: `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`,
        time: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
      })
      return resp
    })
}

// Fetch stats
const fetchStats = () => {
  return node.get()
    .then((ipfsNode) => {
      return Promise.all([ipfsNode.id(), ipfsNode.repo.stat()])
        .then(([id, stat]) => new Response(statsView.render(id, stat, fetchedCIDs, startDateTime), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'text/html' }
        }))
        .catch((err) => new Response(err.toString()))
    })
}

// Fetch request
self.addEventListener('fetch', (event) => {
  const path = event.request.url

  // Not intercepting path
  if (!path.startsWith(`${self.location.origin}/ipfs`)) {
    return
  }

  // Stats Page
  if (path.startsWith(`${self.location.origin}/ipfs/stats`)) {
    event.respondWith(fetchStats())
  } else {
    // Gateway page
    const regex = /^.+?(\/ipfs\/.+)$/g
    const match = regex.exec(path)
    const ipfsPath = match[1]

    event.respondWith(fetchCID(ipfsPath))
  }
})

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting())
})

// Activate service worker
self.addEventListener('activate', (event) => {
  node.get()
    .then((ipfs) => {
      ipfsNode = ipfs

      // Keep a record of the start date and time of the IPFS Node
      const d = new Date()
      startDateTime = {
        date: `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`,
        time: `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`
      }
    })
    .catch((err) => console.err(err))
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
