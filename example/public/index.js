'use strict'

const { createProxyClient } = require('ipfs-postmsg-proxy')
let node

/* UI RELATED */

document.querySelector('#id').addEventListener('click', async () => {
  if (!node) return alert('Service worker not registered')
  const { agentVersion, id } = await node.id()
  alert(`${agentVersion} ${id}`)
})

document.querySelector('#show').addEventListener('click', () => {
  const multihash = document.querySelector('#input').value
  if (!node) {
    alert('Service worker not registered')
  } else if (!node || !multihash || multihash.length < 4) {
    alert(`invalid multihash received: ${multihash}`)
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
    navigator.serviceWorker.register('service-worker-bundle.js')
      .then((registration) => {
        console.log('-> Registered the service worker successfuly')

        node = createProxyClient({
          addListener: navigator.serviceWorker.addEventListener.bind(navigator.serviceWorker),
          removeListener: navigator.serviceWorker.removeEventListener.bind(navigator.serviceWorker),
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
