var common = require('../fixtures/common'),
    assert = require('assert');

exports['`any`: number in string'] = function(test) {
  function check(source, value) {
    var g = common.ag(source);

    assert.ok(g.cache('rule', function() {
      return this.any(function() {
        return this.match(function(v) {
          return '0' <= v && v <= '9';
        });
      });
    }));

    assert.deepEqual(g.intermediate, value);
  };

  check('123a', '123');
  check('1', '1');
  check('abc', '');

  test.done();
};

exports['`many` : number in string'] = function(test) {
  function check(source, value, fail) {
    var g = common.ag(source),
        start = g.cache('rule', function() {
          return this.many(function() {
            return this.match(function(v) {
              return '0' <= v && v <= '9';
            });
          });
        });

    if (fail) {
      assert.ok(!start);
    } else {
      assert.ok(start);
      assert.deepEqual(g.intermediate, value);
    }
  };

  check('123a', '123');
  check('1', '1');
  check('abc', null, true);

  test.done();
};

exports['`optional`: $ in string'] = function(test) {
  function check(source, value, fail) {
    var g = common.ag(source);

    assert.ok(
      g.cache('rule', function() {
        return this.optional(function() {
          return this.match('$');
        })
      })
    );
    assert.deepEqual(g.intermediate, value);
  };

  check('$a', '$');
  check('a', '');

  test.done();
};

exports['token rule'] = function(test) {
  var g = common.ag('token1     token2');

  assert.ok(
    g.cache('rule', function() {
      return this.simulate([function() { return 'token1' }], function() {
        return this.rule('token');
      }) &&
      this.simulate([function() { return 'token2' }], function() {
        return this.rule('token');
      })
    })
  );

  test.done();
};

exports['fromTo rule'] = function(test) {
  var g = common.ag('a/* xyz */b');

  assert.ok(
    g.cache('rule', function() {
      return this.match('a') &&
             this.atomic(function() {
               return this.simulate([
                 function() { return '/*' },
                 function() { return '*/' }
               ], function() {
                 return this.rule('fromTo');
               })
             }) && this.store(function(v) {
               assert.equal(v, '/* xyz */');
             }) && this.match('b');
    })
  );

  test.done();
};
