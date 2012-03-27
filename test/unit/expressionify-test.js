var common = require('../fixtures/common'),
    assert = require('assert');

function unit(source, expected) {
  assert.equal(common.expressionify(source), expected);
}

suite('utils.expressionify', function() {
  test('should add `return` in correct places', function() {
    unit('a', 'a');
    unit('a;b', 'function(){a;return b}.call(this)');
    unit('{ x = 1 }', 'function(){return x=1}.call(this)');
    unit('{ x = 1; y = 2 }', 'function(){x=1;return y=2}.call(this)');
  });

});
