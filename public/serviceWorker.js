/* global self, Response, Ipfs, cache */
// inject Ipfs to global
importScripts('https://cdn.jsdelivr.net/npm/ipfs/dist/index.js');

let ipfsNode = null;

/** create an in memory node (side effect) */
function initIPFS() {
  const repoPath = `ipfs-${Math.random()}`;
  ipfsNode = new Ipfs({
    repo: repoPath,
    config: {
      Addresses: {
        API: '/ip4/127.0.0.1/tcp/0',
        Swarm: ['/ip4/0.0.0.0/tcp/0'],
        Gateway: '/ip4/0.0.0.0/tcp/0',
      },
    },
  });
}

/** helper function to always get a node that's ready to use
 modified from https://github.com/linonetwo/pants-control/blob/0e6cb6d8c319ede051a9aa5279f3a0192e578b9f/src/ipfs/IPFSNode.js#L27 */
function getReadyNode() {
  if (ipfsNode === null) {
    initIPFS();
  }
  return new Promise(resolve => {
    if (ipfsNode.isOnline()) {
      resolve(ipfsNode);
    } else {
      ipfsNode.on('ready', () => {
        if (ipfsNode.isOnline()) {
          resolve(ipfsNode);
        }
      });
    }
  });
}

/** this will get an array of file, type definition can be found at
 https://github.com/linonetwo/pants-control/commit/9d2e44319bb4932dfd1f29bb5f168011b3407de4#diff-f2c5be8b23901c9c4d8cbe549156bb7fR6 */
async function getFile(hash) {
  const node = await getReadyNode();
  return new Promise((resolve, reject) => {
    node.files.get(hash, (err, files) => {
      if (err) {
        return reject(err);
      }
      if (files) {
        resolve(files);
      }
    });
  });
}

const headers = { status: 200, statusText: 'OK', headers: {} };
/** Given a multihash, return first file in DAG as HTTP Response.
 * If first file is actually a folder, add files to cache and return first file that is not a folder.
 */
async function RespondFromIpfs(multihash) {
  try {
    const files = await getFile(multihash);
    console.log(files);
    if (files[0].type === 'dir') {
      /*
        {depth: 0, name: "QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV", path: "QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV", size: 344, hash: Uint8Array(34), type: "dir", content: undefined}
        ,
        {depth: 1, name: "style.css", path: "QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV/style.css", size: 30, hash: Uint8Array(34), …}
      */
      await Promise.all([files[1], files[2]].map(async file => {
        const url = file.path.split(files[0].path)[1];
        console.log(url)
        const cache = await caches.open('v1');
        return cache.put(url, new Response(file.content, headers));
      }));
      return new Response(files[1].content, headers);
    }
    return new Response(files[0].content, headers);
  } catch (error) {
    console.error(error);
  }
}

self.addEventListener('install', event => {
  // kick previous sw after install
  console.log('Service worker is installing.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  console.log(`Service worker getting ${event.request.url}`);
  if (event.request.url.startsWith(`${self.location.origin}/ipfs`)) {
    const multihash = event.request.url.split('/ipfs/')[1];
    console.log(`The hash is ${multihash}, trying to response it with content got from IPFS.`);
    event.respondWith(RespondFromIpfs(multihash));
  }
});
