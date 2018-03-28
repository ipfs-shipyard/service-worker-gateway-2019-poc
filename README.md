# ipfs-browser-gateway

Given an IPFS multihash, print the content and try to render web page if the content is HTML.

## Development

This is a "create-react-app" app, so just:

`yarn && yarn start`

## Drawback

1. 第一次访问速度比较慢，远低于 HTTP 服务器。当然，访问 ```http://ipfs.io/ipfs``` 也是这个速度
1. 没有长期缓存，所以隔一段时间后访问都会是第一次访问的那个速度，不像 ipfs.io/ipfs 后续访问会比较快。
1. 像 [QmRoYXgYMfcP7YQR4sCuSeJy9afgA5XDJ78JzWntpRhmcu](http://ipfs.io/ipfs/QmRoYXgYMfcP7YQR4sCuSeJy9afgA5XDJ78JzWntpRhmcu) 这样的大文件会崩（可能因为我现在用的是 files.get），目前比较适合访问 IPFS 上的 HTML 文件。
