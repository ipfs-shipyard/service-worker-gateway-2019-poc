/* global self, Response */
const IPFS = require('ipfs');

let node = null;

/** create an in memory node (side effect) */
function initIPFS() {
  const repoPath = `ipfs-${Math.random()}`;
  node = new IPFS({
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
  if (node === null) {
    initIPFS();
  }
  return new Promise(resolve => {
    if (node.isOnline()) {
      resolve(node);
    } else {
      node.on('ready', () => {
        if (node.isOnline()) {
          resolve(node);
        }
      });
    }
  });
}

/** this will get an array of file, type definition can be found at
 https://github.com/linonetwo/pants-control/commit/9d2e44319bb4932dfd1f29bb5f168011b3407de4#diff-f2c5be8b23901c9c4d8cbe549156bb7fR6 */
function getFile(hash) {
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

/** Using files.cat, see https://github.com/ipfs/ipfs-service-worker
 * This will not deal with folder.
 */
async function catAndRespond(hash) {
  const data = await node.files.cat(hash);
  const headers = { status: 200, statusText: 'OK', headers: {} };
  return new Response(data, headers);
}

self.addEventListener('install', event => {
  // kick previous sw after install
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(`${self.location.origin}/hash`)) {
    console.log(`SW getting ${event.request.url}`);

    const multihash = event.request.url.split('/hash/')[1];
    event.respondWith(catAndRespond(multihash));
  }
});
