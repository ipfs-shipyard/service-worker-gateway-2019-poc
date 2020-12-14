# ⛔️ DEPRECATED

_This example is out of date and will not be maintained._

See the modern end-to-end example of using js-ipfs node in `SharedWorker` from `ServiceWorker` at [`ipfs/js-ipfs/examples/browser-service-worker`](https://github.com/ipfs/js-ipfs/tree/master/examples/browser-service-worker)


---


# service-worker-gateway

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![](https://img.shields.io/badge/freenode-%23ipfs-blue.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23ipfs)
[![standard-readme](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

> An IPFS gateway fully running on a Service Worker, in order to serve all your IPFS urls directly!

## Lead Maintainer

[Vasco Santos](https://github.com/vasco-santos).

### Installation

```sh
> npm i service-worker-gateway
```

### Testing the example

Run the following commands:

```sh
> git clone https://github.com/ipfs-shipyard/service-worker-gateway.git
> cd service-worker-gateway
> npm install
> cd example
> npm install
> npm run build
> npm run start
```

## Usage

The service worker gateway will get in action when specifc HTTP requests occur.

- `/ipfs/{HASH}` - Get the content of the file represented by the Hash
- `/stats` - Get the current stats of the IPFS Node running in the service worker

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

## Related

- [js-ipfs-http-response](https://github.com/ipfs/js-ipfs-http-response)
- [ipfs-post-msg-proxy](https://github.com/tableflip/ipfs-postmsg-proxy)

## License

[MIT](https://github.com/ipfs-shipyard/service-worker-gateway/blob/master/LICENSE)
