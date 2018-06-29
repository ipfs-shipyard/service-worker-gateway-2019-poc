/* global Request, self */
/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const clearModule = require('clear-module')
const makeServiceWorkerEnv = require('service-worker-mock')
global.window = require('./helpers/mock-window')()

describe('Service worker', function () {
  beforeEach(() => {
    Object.assign(
      global,
      makeServiceWorkerEnv()
    )
    clearModule('../src')
  })

  it('should add listeners correctly', () => {
    require('../src')

    expect(self.listeners['install']).to.exist()
    expect(self.listeners['activate']).to.exist()
    expect(self.listeners['fetch']).to.exist()
  })

  it('should return an HTTP response from an IPFS node correctly with the file', function (done) {
    require('../src')
    this.timeout(50 * 1000)

    const multihash = 'QmT78zSuBmuS4z925WZfrqQ1qHaJ56DQaTfyMUF7F8ff5o'

    self.trigger('fetch', new Request(`/ipfs/${multihash}`))
      .then((response) => {
        expect(response).to.exist()
        expect(response.body).to.exist()
        expect(response.headers).to.exist()

        done()
      })
  })
})
