/* global Request */
/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const clearModule = require('clear-module')
const makeServiceWorkerEnv = require('service-worker-mock')

describe('Service worker', function () {
  beforeEach(() => {
    Object.assign(
      global,
      makeServiceWorkerEnv()
    )
    clearModule('../src/index.js')
  })

  it('should add listeners correctly', () => {
    require('../src/index.js')

    expect(self.listeners['install']).to.exist()
    expect(self.listeners['activate']).to.exist()
    expect(self.listeners['fetch']).to.exist()
  })

  it('should return a file from an IPFS node correctly', async () => {
    require('../src/index.js')

    const multihash = 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o'
    const response = await self.trigger('fetch', new Request(`/ipfs/${multihash}`))
    expect(response).to.exist()
  })
})
