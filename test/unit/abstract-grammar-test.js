var common = require('../fixtures/common'),
    assert = require('assert');

suite('AbstractGrammar class', function() {
  suite('.any() method given digit as body should work', function() {
    function check(source, value) {
      var g = common.ag(source);

      assert.ok(g.cache('g', 'rule', function() {
        return this.any(function() {
          return this.match(function(v) {
            return '0' <= v && v <= '9';
          });
        });
      }));

      assert.deepEqual(g.intermediate, value);
    };

    test('on `123a` string', function() {
      check('123a', ['1', '2', '3']);
    });

    test('on `1` string', function() {
      check('1', ['1']);
    });

    test('even on `abc` string', function() {
      check('abc', []);
    });
  });

  suite('.many() method given digit as body should', function() {
    function check(source, value, fail) {
      var g = common.ag(source),
          start = g.cache('g', 'rule', function() {
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

    test('work on `123a` string', function() {
      check('123a', ['1', '2', '3']);
    });

    test('work on `1` string', function() {
      check('1', ['1']);
    });

    test('fail on `abc` string', function() {
      check('abc', null, true);
    });

  });

  suite('.optional() method given `$` match as body should', function() {
    function check(source, value, fail) {
      var g = common.ag(source);

      assert.ok(
        g.cache('g', 'rule', function() {
          return this.optional(function() {
            return this.match('$');
          })
        })
      );
      assert.deepEqual(g.intermediate, value);
    };

    test('work on `$a` string', function() {
      check('$a', '$');
    });

    test('fail on `a` string', function() {
      check('a', undefined);
    });
  });

  suite('`token` rule', function() {
    test('should match token and spaces in string', function() {
      var g = common.ag('token1     token2');

      assert.ok(
        g.cache('g', 'rule', function() {
          return this.simulate(['token1'], function() {
            return this.rule('token');
          }) &&
          this.simulate(['token2'], function() {
            return this.rule('token');
          })
        })
      );
    });
  });

  suite('`fromTo` rule', function() {
    test('should match chars between `from` and `to` in string', function() {
      var g = common.ag('a/* xyz */b');

      assert.ok(
        g.cache('g', 'rule', function() {
          return this.match('a') &&
                 this.atomic(function() {
                   return this.simulate(['/*', '*/'], function() {
                     return this.rule('fromTo');
                   })
                 }) && this.store(function(v) {
                   assert.equal(v, '/* xyz */');
                 }) && this.match('b');
        })
      );
    });
  });

  suite('`seq` rule', function() {
    test('should match sequence of chars in string', function() {
      var g = common.ag('abcd');

      assert.ok(
        g.cache('g', 'rule', function() {
          return this.match('a') &&
                 this.rule('seq', ['bcd']) &&
                 this.store(function(v) {
                   assert.equal(v, 'bcd');
                 });
        })
      );
    });
  });
});
