/* global alert */

'use strict'

const { createProxyClient } = require('ipfs-postmsg-proxy')

const swName = 'service-worker-bundle.js'
let node

navigator.serviceWorker.getRegistrations().then((registrations) => {
  for (var registration of registrations) {
    registration.unregister()
  }
})

/* UI RELATED */

document.querySelector('#id').addEventListener('click', async () => {
  if (!node) {
    return alert('Service worker not registered') // eslint-disable-line no-alert
  }
  const { agentVersion, id } = await node.id()
  alert(`${agentVersion} ${id}`) // eslint-disable-line no-alert
})

document.querySelector('#show').addEventListener('click', () => {
  const multihash = document.querySelector('#input').value
  if (!node) {
    alert('Service worker not registered') // eslint-disable-line no-alert
  } else if (!node || !multihash || multihash.length < 4) {
    alert(`invalid multihash received: ${multihash}`) // eslint-disable-line no-alert
  } else {
    window.location.href = `/ipfs/${multihash}`
  }
})

document.querySelector('#serviceWorkerStart').addEventListener('click', () => {
  if (!node) {
    register()
    document.querySelector('#serviceWorkerStart').classList.add('disable-button')
    document.querySelector('#serviceWorkerStop').classList.remove('disable-button')
  }
})

document.querySelector('#serviceWorkerStop').addEventListener('click', () => {
  if (node) {
    unregister()
    document.querySelector('#serviceWorkerStart').classList.remove('disable-button')
    document.querySelector('#serviceWorkerStop').classList.add('disable-button')
  }
})

/* Service worker related */
const register = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(swName)
      .then((registration) => {
        node = createProxyClient({
          addListener: navigator.serviceWorker.addEventListener.bind(navigator.serviceWorker),
          postMessage: (data) => navigator.serviceWorker.controller.postMessage(data)
        })
      })
      .catch((err) => {
        console.log('-> Failed to register:', err)
      })
  }
}

const unregister = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.unregister()
      node = null
    })
  }
}
