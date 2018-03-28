# ipfs-browser-gateway

Given an IPFS multihash, print the content and try to render web page if the content is HTML.

## Development

This is a "create-react-app" app, so just:

`yarn && yarn start`

## Drawback

1. First visit is way slower than traditional HTTP page. Though ```http://ipfs.io/ipfs``` is slow too.
1. Can't promise long term cache, compare to gateway running in a server, who can pin a file for a longer time.
1. Large folders like [QmRoYXgYMfcP7YQR4sCuSeJy9afgA5XDJ78JzWntpRhmcu](http://ipfs.io/ipfs/QmRoYXgYMfcP7YQR4sCuSeJy9afgA5XDJ78JzWntpRhmcu) may destroy service worker (maybe due to my using ```files.get```), so it's more suitable to just load HTML pages in this way.
1. I'm hard coding to experiment with folder loading, so it can only load multihash listed in the example. 

## Road Map

- Traverse DAG, support all kinds of folders to be open.
- [Use Stream API to deal with large folders.](https://yq.aliyun.com/articles/236593?spm=a2c4e.11153940.blogcont236587.14.2d559182Moi5sK)
