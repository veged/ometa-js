var common = require('../fixtures/common'),
    assert = require('assert');

suite('Ometajs module', function() {
  function unit(grmr, rule, src, dst) {
    var i = new grmr(src);

    assert.ok(i._rule(rule));
    if (dst) assert.deepEqual(i._getIntermediate(), dst);
  };

  suite('given a simple left recursion grammar', function() {
    var grmr = common.require('lr').LeftRecursion;

    test('should match input successfully', function() {
      unit(
        grmr,
        'expr',
        '123 + 456 - 789.4',
        [
          '-' ,
          [ '+', [ 'number', 123 ], [ 'number', 456 ] ],
          [ 'number', 789.4 ]
        ]
      );
    });
  });

  suite('given a javascript grammar', function() {
    var grmr = common.require('bs-js-compiler').BSJSParser;

    function js(code, ast) {
      var name;
      if (code.length > 50) {
        name = code.slice(0, 47) + '...';
      } else {
        name = code;
      }

      test('`'+ name + '`', function() {
        unit(grmr, 'topLevel', code, ast);
      });
    }

    suite('should match', function() {
      js('var x', ['begin', ['var', ['x']]]);
      js('var x = 1.2', ['begin', ['var', ['x', ['number', 1.2]]]]);
      js('var x = 1e2, y, z;', ['begin',
         ['var', ['x', ['number', 100]], ['y'], ['z']]
      ]);
      js('x.y', [ 'begin', [ 'getp', [ 'string', 'y' ], [ 'get' , 'x' ] ] ]);

      js('function a() {}', ['begin',
         ['var', ['a', ['func', [], ['begin']]]]
      ]);

      js('function a() {return a()}', ['begin',
         ['var', ['a', ['func', [], ['begin', [
           'return', ['call', ['get', 'a']]
         ]]]]]
      ]);

      js('function a() {return a()};"123"+"456"', ['begin',
         ['var', ['a', ['func', [], [
           'begin', ['return', ['call', ['get', 'a']]]
         ]]]],
         ['get', 'undefined'],
         ['binop', '+', ['string', '123'], ['string', '456']]
      ]);
    });
  });
});
