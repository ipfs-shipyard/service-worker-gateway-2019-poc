/* eslint-disable no-restricted-globals, import/no-unresolved */
/* global importScripts, self, Response, Ipfs, caches, mimeTypes, pullStream, readableStream, streamToPullStream, resolveDirectory, resolveMultihash, joinURLParts, removeTrailingSlash */

// inject Ipfs to global
importScripts('https://cdn.jsdelivr.net/npm/ipfs/dist/index.js');
// inject utils and resolvers to global
importScripts('./pathUtil.js');
importScripts('./resolver.js');
/* inject dependencies to global
    those who use module.exports use ./require.js polyfill
*/
importScripts('./require.js');
const fileType = require('https://unpkg.com/file-type@7.7.1/index.js');
/* inject dependencies to global
    those who needs browserify gets browserify by https://wzrd.in/
*/
importScripts('https://wzrd.in/standalone/mime-types');
importScripts('https://wzrd.in/standalone/readable-stream');
importScripts('https://wzrd.in/standalone/https://wzrd.in/standalone/pull-stream');
importScripts('https://wzrd.in/standalone/stream-to-pull-stream');

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

/** helper function to always get an ipfs node that's ready to use
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

function handleGatewayResolverError(ipfs, path, err) {
  if (err) {
    console.error('err: ', err.toString(), ' fileName: ', err.fileName);

    const errorToString = err.toString();
    // switch case with true feels so wrong.
    switch (true) {
      case errorToString === 'Error: This dag node is a directory':
        resolveDirectory(ipfs, path, err.fileName, (error, data) => {
          if (error) {
            console.error(error);
            return reply(error.toString()).code(500);
          }
          if (typeof data === 'string') {
            // no index file found
            if (!path.endsWith('/')) {
              // for a directory, if URL doesn't end with a /
              // append / and redirect permanent to that URL
              return reply.redirect(`${path}/`).permanent(true);
            }
            // send directory listing
            return reply(data);
          }
          // found index file
          // redirect to URL/<found-index-file>
          return reply.redirect(joinURLParts(path, data[0].name));
        });
        break;
      case errorToString.startsWith('Error: no link named'):
        return reply(errorToString).code(404);
      case errorToString.startsWith('Error: multihash length inconsistent'):
      case errorToString.startsWith('Error: Non-base58 character'):
        return reply({ Message: errorToString, code: 0 }).code(400);
      default:
        console.error(err);
        return reply({ Message: errorToString, code: 0 }).code(500);
    }
  }
}

async function getFile(path) {
  const ipfs = await getReadyNode();

  resolveMultihash(ipfs, path, (err, data) => {
    if (err) {
      return handleGatewayResolverError(err);
    }

    const stream = ipfs.files.catReadableStream(data.multihash);
    stream.once('error', error => {
      if (error) {
        console.error(error);
        return reply(error.toString()).code(500);
      }
    });

    if (path.endsWith('/')) {
      // remove trailing slash for files
      return reply.redirect(removeTrailingSlash(path)).permanent(true);
    }
    if (!stream._read) {
      stream._read = () => {};
      stream._readableState = {};
    }

    // response.continue()
    let filetypeChecked = false;
    const stream2 = new readableStream.PassThrough({ highWaterMark: 1 });
    stream2.on('error', error => {
      console.error('stream2 error: ', error);
    });

    const response = reply(stream2).hold();

    pullStream(
      streamToPullStream.source(stream),
      pullStream.through(chunk => {
        // Check file type.  do this once.
        if (chunk.length > 0 && !filetypeChecked) {
          console.log('got first chunk');
          const fileSignature = fileType(chunk);
          console.log('file type: ', fileSignature);

          filetypeChecked = true;
          const mimeType = mimeTypes.lookup(fileSignature ? fileSignature.ext : null);

          console.log('path ', path);
          console.log('mime-type ', mimeType);

          if (mimeType) {
            console.log('writing mimeType');

            response.header('Content-Type', mimeTypes.contentType(mimeType)).send();
          } else {
            response.send();
          }
        }

        stream2.write(chunk);
      }),
      pullStream.onEnd(() => {
        console.log('stream ended.');
        stream2.end();
      }),
    );
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
      await Promise.all(
        [files[1], files[2]].map(async file => {
          const url = file.path.split(files[0].path)[1];
          console.log(url);
          const cache = await caches.open('v1');
          return cache.put(url, new Response(file.content, headers));
        }),
      );
      return new Response(files[1].content, headers);
    }
    return new Response(files[0].content, headers);
  } catch (error) {
    console.error(error);
  }
}

async function tryMatchCache(multihashOrContentName) {
  try {
    const cachedContent = await caches.match(multihashOrContentName);
    if (cachedContent) {
      const contentName = multihashOrContentName;
      console.log(`Browser is requesting ${contentName}, trying to response it with content cached from IPFS.`);
      return cachedContent;
    }
  } catch (error) {
    console.log(error);
  }
  // now sure it's multihash
  const multihash = multihashOrContentName;
  console.log(`Browser is requesting ${multihash}, trying to get files from IPFS.`);
  return RespondFromIpfs(multihash);
}

self.addEventListener('install', event => {
  // kick previous sw after install
  console.log('Service worker is installing.');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('fetch', event => {
  console.log(`Service worker getting ${event.request.url}`);
  if (event.request.url.startsWith(`${self.location.origin}/ipfs`)) {
    // 1. we will goto /ipfs/multihash so this will be a multihash
    // 2. if returned file of that multihash is a HTML, it will request for other content
    // so this will be content name. We may had cached this file in 1, so subsequent request will hit the cache.
    const multihashOrContentName = event.request.url.split('/ipfs/')[1];
    event.respondWith(tryMatchCache(multihashOrContentName));
  }
});
