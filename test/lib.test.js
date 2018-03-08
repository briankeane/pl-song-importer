const assert = require('assert')
const mocha = require('mocha')
const describe = mocha.describe
const it = mocha.it

const lib = require('../lib/lib')

describe('Hello World', function () {
  it('should return world', async function (){
      let result = await lib.hello()
      assert.equal(result, 'world')
  })
})
