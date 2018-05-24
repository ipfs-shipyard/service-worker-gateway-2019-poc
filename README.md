# service-worker-gateway

> An IPFS gateway fully running on a Service Worker, in order to serve all your IPFS urls directly!

### Installation

> npm i service-worker-gateway

### Testing the example

* Clone the repo from here
* `$ cd service-worker-gateway`
* `$ npm install`
* `$ cd example`
* `$ npm install`
* `$ npm run build`
* `$ npm run start`

### Service Worker running on IPFS node

The service worker code lives in `src/index.js`. This is the code that will run as a service worker. It boots up an IPFS node, responds to requests and exposes the running node for use by web pages within the scope of the service worker.

The IPFS node is created when the service worker ['activate' event](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/onactivate) is fired:

```js
const IPFS = require('ipfs')

self.addEventListener('activate', () => {
  // Node started
})
```

The service worker listens for ['fetch' events](https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent) so that it can [respond](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response) to certain requests:

```js
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
```

Finally, the IPFS node is exposed for use by web pages/apps. Service workers are permitted to talk to web pages via a messaging API so we can use [`ipfs-postmsg-proxy`](https://github.com/tableflip/ipfs-postmsg-proxy) to talk to the IPFS node running in the worker. We create a "proxy server" for this purpose:

```js
const { createProxyServer } = require('ipfs-postmsg-proxy')
// Setup a proxy server that talks to our real IPFS node
createProxyServer(() => ipfs, { /* ...config... */ })
```

### Application code

The application code is responsible for registering the service worker and talk to the IPFS node that runs in it.

It is important to do feature detect, in order to verify if the client's browser supports service workers, and then the service worker is ready for being [registered](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register). Example:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker-bundle.js')
    .then((reg) => console.log('Successful service worker register'))
    .catch((err) => console.error('Failed service worker register', err))
}
```

Once the service worker is registered, it is possible to start communicating with the IPFS node that is running. To do this, we create a "proxy client" which can talk to our "proxy server" over the messaging API:

```js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker-bundle.js')
    .then(async () => {
      ipfs = createProxyClient({ /* ...config... */ })

      // Now use `ipfs` as usual! e.g.
      const { agentVersion, id } = await ipfs.id()
    })
}
```
