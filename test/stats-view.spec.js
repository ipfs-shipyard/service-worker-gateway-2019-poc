/* eslint max-nested-callbacks: ["error", 6] */
/* global Request, self */
/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const clearModule = require('clear-module')
const makeServiceWorkerEnv = require('service-worker-mock')
const indexedDB = require('fake-indexeddb')

global.window = require('./helpers/mock-window')()
global.indexedDB = indexedDB

const checkAll = (bits) => string => bits.every(bit => string.includes(bit))
const checkAny = (bits) => string => bits.some(bit => string.includes(bit))

describe('Stats view page', function () {
  beforeEach(() => {
    Object.assign(
      global,
      makeServiceWorkerEnv()
    )
    clearModule('../src')
  })

  it('should return the stats page with empty fetched hashes correctly', function () {
    this.timeout(50 * 1000)

    require('../src')

    return self.trigger('fetch', new Request(`/stats`))
      .then((response) => {
        expect(response).to.exist()
        expect(response.headers).to.exist()
        expect(response.body).to.exist()
        expect(response.body).to.not.satisfy(checkAny([
          'QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/about'
        ]))
      })
  })

  it('should return the stats page with the fetched hashes correctly', function () {
    this.timeout(50 * 1000)

    require('../src')

    return self.trigger('fetch', new Request(`/ipfs/QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV`))
      .then((response) => {
        expect(response).to.exist()

        return self.trigger('fetch', new Request(`/stats`))
      })
      .then((response) => {
        expect(response).to.exist()
        expect(response.body).to.satisfy(checkAll([
          'QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV'
        ]))

        return self.trigger('fetch', new Request(`/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`))
      })
      .then((response) => {
        expect(response).to.exist()

        return self.trigger('fetch', new Request(`/stats`))
      })
      .then((response) => {
        expect(response).to.exist()
        expect(response.body).to.satisfy(checkAll([
          'QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG'
        ]))

        return self.trigger('fetch', new Request(`/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/about`))
      })
      .then((response) => {
        expect(response).to.exist()

        return self.trigger('fetch', new Request(`/stats`))
      })
      .then((response) => {
        expect(response).to.exist()
        expect(response.body).to.satisfy(checkAll([
          'QmeYxwj4CwCeGVhwi3xLrmBZUUFQdftshSiGLrTdTnWEVV',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG',
          'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG/about'
        ]))
      })
  })
})
