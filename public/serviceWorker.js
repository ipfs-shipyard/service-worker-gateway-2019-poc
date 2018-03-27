/* global self, Response, Ipfs */
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

/** Using files.cat, see https://github.com/ipfs/ipfs-service-worker
 * This can not deal with the folder: "Error: this dag node is a directory"
 * And it will block the page.
 */
async function catAndRespond(hash) {
  const node = await getReadyNode();
  const data = await node.files.cat(hash);
  console.log('catAndRespond');
  console.log(data);
  const headers = { status: 200, statusText: 'OK', headers: {} };
  return new Response(data, headers);
}

self.addEventListener('install', event => {
  // kick previous sw after install
  console.log('Service worker is installing.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', async event => {
  console.log(`Service worker getting ${event.request.url}`);
  if (event.request.url.startsWith(`${self.location.origin}/ipfs`)) {
    const multihash = event.request.url.split('/ipfs/')[1];
    console.log(`The hash is ${multihash}`);

    try {
      const files = await getFile(multihash);
    } catch (error) {
      console.error(error);
    }
  }
});
