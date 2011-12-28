var common = require('../fixtures/common'),
    assert = require('assert');

suite('AbstractParser class', function() {
  suite('given `123` string against multiple char matches', function() {
    var p = common.ap('123');

    test('should match `1` `2` `3` sequence', function() {
      assert.ok(p.match('1') && p.match('2') && p.match('3'));
    });

    test('and then fail on `1`', function() {
      assert.ok(!(p.match('1')));
    });
  });

  suite('given `123` against `124` or `123` sequence matches', function() {
    var p = common.ap('123');

    test('should not fail', function() {
      assert.ok(p.atomic(function() {
        return this.match('1') && this.match('2') && this.match('4');
      }) || p.atomic(function() {
        return this.match('1') && this.match('2') && this.match('3');
      }));
    });

    test('should choose `123` as intermediate value', function() {
      assert.equal(p.intermediate, '123');
    });
  });

  suite('given `123` against `1` lookahead and `123` sequence', function() {
    var p = common.ap('123');

    test('should match', function() {
      assert.ok(p.atomic(function() {
        return this.match('1');
      }, true) || p.atomic(function() {
        return this.match('1') && this.match('2') && this.match('3');
      }));
    });
  });

  suite('given a nested list against nested list', function() {
    test('should match', function() {
      assert.ok(common.ap([
        '1',
        '2',
        ['3', '4'],
        '5'
      ]).atomic(function() {
        return this.match('1') && this.match('2') && this.list(function() {
          return this.match('3') && this.match('4');
        }) && this.match('5')
      }));
    });
  });

  suite('given `3` against simulates and groups matches', function() {
    test('should match', function() {
      assert.ok(common.ap('3').atomic(function() {
        return this.atomic(function() {
          return this.simulate([
            function() { return '2' }
          ], function() {
            return this.simulate([
              function() { return '1' }
            ], function() {
              return this.match('1') && this.match('2') && this.match('3');
            });
          });
        })
      }));
    });
  });
});
