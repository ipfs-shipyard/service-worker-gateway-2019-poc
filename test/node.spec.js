/* eslint-env mocha */

'use strict'

const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const ipfsNode = require('../src/node')

describe('Service worker running node', function () {
  it('should start a node and return it', async () => {
    const node = await ipfsNode.get()

    expect(node).to.exist()
    expect(node).to.have.property('repo')
  })
})
