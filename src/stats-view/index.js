'use strict'

const mainStyle = require('./style')
const filesize = require('filesize')

const renderNodePanel = (ipfsId, stat, startDateTime) => {
  const { id, agentVersion, protocolVersion, publicKey } = ipfsId // ipfs.id
  const { repoSize } = stat // ipfs.repo.stat

  return `
    <div class="content-spacing">
      <p>
        <strong>Peer ID</strong>
        <code>${id}</code>
      </p>
      <p>
        <strong>Agent Version</strong>
        <code>${agentVersion}</code>
      </p>
      <p>
        <strong>Protocol Version</strong>
        <code>${protocolVersion}</code>
      </p>
      <p>
        <strong>Repo Size</strong>
        <code>${filesize(repoSize)}</code>
      </p>
      <p>
        <strong>Running Since</strong>
        <code>${startDateTime.date} - ${startDateTime.time}</code>
      </p>
      <div>
        <strong>Public Key</strong>
        <pre class="panel textarea-panel">${publicKey}</pre>
      </div>
    </div>
  `
}

const renderCIDsPanel = (fetchedCIDs) => {
  if (!fetchedCIDs.length) {
    return `
      <div class="panel-heading">
        <strong>FETCHED CIDs</strong>
      </div>
      <div class="content-spacing">
        <p>Any CID fetched so far</p>
      </div>
    `
  }

  const rows = fetchedCIDs.map((fetched) => {
    let row = [
      `<a href="/ipfs/${fetched.cid}">${fetched.cid}</a>`,
      `<div>${fetched.date}</div>`,
      `<div>${fetched.time}</div>`
    ]

    row = row.map((cell) => `<td>${cell}</td>`).join('')

    return `<tr className="table-row-spacing">${row}</tr>`
  })

  return `
    <table class="table table-striped">
      <tbody>
        <tr>
          <td class="table-panel-heading">
            <div><strong>FETCHED CIDs</strong></div>
          </td>
          <td>
            <div><strong>Date</strong></div>
          </td>
          <td>
            <div><strong>Time</strong></div>
          </td>
        </tr>
        ${rows.join('')}
      </tbody>
    </table>
  `
}

const render = (ipfsId, stat, fetchedCIDs, startDateTime) => (
  `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>IPFS Node Stats Page</title>
      <style>${mainStyle}</style>
    </head>
    <body>
      <div id="header" class="row">
        <div class="col-xs-2">
          <div id="logo" class="ipfs-logo"></div>
        </div>
      </div>
      <br>
      <div class="col-xs-12">
        <div class="panel panel-default">
          <div class="panel-heading">
            <strong>NODE INFO</strong>
          </div>
          ${renderNodePanel(ipfsId, stat, startDateTime)}
        </div>
      </div>
      <br>
      <div class="col-xs-12">
        <div class="panel panel-default">
          ${renderCIDsPanel(fetchedCIDs)}
        </div>
      </div>
    </body>
    </html>
  `
)

exports = module.exports
exports.render = render
