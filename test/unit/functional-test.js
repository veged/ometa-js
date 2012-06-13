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

  suite('given a grammar with local statement', function() {
    var grmr = common.require('local').Local;

    test('should match input successfully', function() {
      unit(grmr, 'rule', '+', 1);
      unit(grmr, 'rule', '-', 0);
    });
  });

  suite('given a javascript grammar\'s', function() {
    suite('parser', function() {
      var grmr = common.ometajs.grammars.BSJSParser;

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

        js('/a/', ['begin', ['regExp', '/a/']]);

        js('{ a: 1 , b: 2 }', [
           'begin',
           [ 'json',
             ['binding','a',['number',1]],
             ['binding','b',['number',2]]
           ]
        ]);

        js('var a = b || c\nx', [
           "begin",
           ["var", ["a",["binop","||",["get","b"],["get","c"]]]],
           ["get","x"]
        ]);
      });
    });

    suite('compiler', function() {
      var grmr = common.ometajs.grammars.BSJSTranslator;

      function unit(name, ast, source) {
        test(name, function() {
          assert.equal(grmr.match(ast, 'trans'), source);
        });
      }

      unit('undefined', ['get', 'undefined'], 'undefined');
      unit('basic name', ['get', 'a'], 'a');
      unit('var declaration', ['var', ['x', ['number', 1]]], 'var x = (1)');
      unit(
        'block with statements',
        ['begin', ['get', 'x'], ['var', ['x', ['number', 1]]]],
        '{x;var x = (1)}'
      );
      unit(
        'binop',
        ['binop', '+', ['get', 'x'], ['get', 'y']],
        '(x + y)'
      );
      unit(
        'complex assignment',
        ['set', ['getp', ['get', 'x'], ['get', 'y']], ['get', 'z']],
        '(y[x]=z)'
      );
    });
  });

  suite('Various grammars', function() {
    function unit(name, grmr, rule, source, result) {
      grmr = common.require(grmr).Grammar;

      test(name, function() {
        assert.deepEqual(grmr.match(source, rule), result);
      });
    }

    unit('grammar with repeating rule', 'rep-rule', 'rule', false, false);
  });
});
