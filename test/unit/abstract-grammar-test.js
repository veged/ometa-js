var common = require('../fixtures/common'),
    assert = require('assert');

exports['`any`: number in string'] = function(test) {
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

exports['`many` : number in string'] = function(test) {
  function check(source, value, fail) {
    var g = common.ag(source),
        start = g.enter('rule', 0) &&
                g.many(function() {
                  return this.enter('rule', 1) &&
                         this.range('0', '9') &&
                         this.leave();
                });

    if (fail) {
      assert.ok(!start);
    } else {
      assert.ok(start);
      assert.deepEqual(g.state.intermediate, value);
      assert.ok(g.leave());
    }
  };

  check('123a', ['1', '2', '3']);
  check('1', ['1']);
  check('abc', [], true);

  test.done();
};

exports['`optional`: $ in string'] = function(test) {
  function check(source, value, fail) {
    var g = common.ag(source);

    assert.ok(
      g.enter('rule', 0) &&
      g.optional(function() {
        return this.enter('rule', 1) &&
               this.match('$') &&
               this.leave();
      })
    );
    assert.deepEqual(g.state.intermediate, value);
    assert.ok(g.leave());
  };

  check('$a', '$');
  check('a', undefined);

  test.done();
};
