var common = require('../fixtures/common'),
    assert = require('assert');

exports['bsjsparser should generate ast'] = function(test) {
  var ast;
  assert.doesNotThrow(function() {
    ast = common.ometajs.BSJSParser.matchAll('var x = 1', 'topLevel');
  });

  assert.ok(Array.isArray(ast));
  test.done();
};

exports['bsjsidentity should not change ast'] = function(test) {
  var ast1,
      ast2;

  assert.doesNotThrow(function() {
    ast1 = common.ometajs.BSJSParser.matchAll('var x = 1', 'topLevel');
    ast2 = common.ometajs.BSJSIdentity.matchAll([ast1], 'trans');
  });

  assert.ok(Array.isArray(ast1));
  assert.ok(Array.isArray(ast2));

  assert.deepEqual(ast1, ast2);

  test.done();
};

exports['bsjstranslator should compile to js'] = function(test) {
  var ast,
      code;

  assert.doesNotThrow(function() {
    ast = common.ometajs.BSJSParser.matchAll('var x = 1', 'topLevel');
    code = common.ometajs.BSJSTranslator.matchAll([ast], 'trans');
  });

  assert.ok(Array.isArray(ast));
  assert.ok(/var\s+x/.test(code));

  test.done();
};
