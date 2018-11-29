/* global self, Response */

'use strict'

const { createProxyServer } = require('ipfs-postmsg-proxy')
const { getResponse } = require('ipfs-http-response')
const { get, set } = require('idb-keyval')

const node = require('./node')
const statsView = require('./stats-view')

const getFormattedDate = (d) => `${d.getFullYear()}/${d.getMonth()}/${d.getDate()}`
const getFormattedTime = (d) => `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`

let ipfsNode

// Fetch CID
const fetchCID = (ipfsPath) => {
  return node.get()
    .then((ipfsNode) => {
      return Promise.all([getResponse(ipfsNode, ipfsPath), get('fetched-cids')])
        .then(([resp, fetchedCIDs = []]) => {
          // Keep a record of the fetched CID (and fetch date)
          const d = new Date()

          fetchedCIDs.push({
            cid: ipfsPath.split('/ipfs/')[1],
            date: getFormattedDate(d),
            time: getFormattedTime(d)
          })

          return set('fetched-cids', fetchedCIDs).then(() => resp)
        })
        .catch((err) => new Response(err.toString()))
    })
}

// Fetch stats
const fetchStats = () => {
  return node.get()
    .then((ipfsNode) => {
      return Promise.all([ipfsNode.id(), ipfsNode.repo.stat(), get('fetched-cids'), get('start-date-time')])
        .then(([id, stat, fetchedCIDs = [], startDateTime = {}]) => {
          return new Response(statsView.render(id, stat, fetchedCIDs, startDateTime), {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html' }
          })
        })
        .catch((err) => new Response(err.toString()))
    })
}

// Fetch request
self.addEventListener('fetch', (event) => {
  const path = event.request.url
  const isIpfsRequest = path.startsWith(`${self.location.origin}/ipfs/`)
  const isStatsRequest = path.startsWith(`${self.location.origin}/stats`)

  // Not intercepting path
  if (!(isIpfsRequest || isStatsRequest)) {
    return
  }

  // Stats Page
  if (isStatsRequest) {
    event.respondWith(fetchStats())
  } else {
    // Gateway page
    const match = path.match(/(\/ipfs\/.*?)(#|\?|$)/)
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

      set('fetched-cids', [])
      set('start-date-time', {
        date: getFormattedDate(d),
        time: getFormattedTime(d)
      })
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
