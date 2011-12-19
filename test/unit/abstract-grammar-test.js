var common = require('../fixtures/common'),
    assert = require('assert');

exports['any number of num chars'] = function(test) {
  function check(source, value) {
    var g = common.ag(source);

    assert.ok(g.enter('rule', 0) &&
              g.any(function() {
                return this.enter('rule', 1) &&
                       this.range('0', '9') &&
                       this.leave();
              }));

    assert.deepEqual(g.state.intermediate, value);
    assert.ok(g.leave());
  };

  check('123a', ['1', '2', '3']);
  check('1', ['1']);
  check('abc', []);

  test.done();
};
