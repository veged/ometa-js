var common = require('../fixtures/common'),
    assert = require('assert');

var units = [
  { hint: 'only keyword', src: 'ometa', throws: true },
  { hint: 'no closing bracket', src: 'ometa name {', throws: true },
  { hint: '<: without name', src: 'ometa name <: { }', throws: true },
  { hint: 'no keyword', src: 'name {}', throws: true },
  {
    hint: 'empty grammar',
    src: 'ometa name {\n}',
    dst: [ 'topLevel', [ [ 'grammar', 'name', null, [] ] ] ]
  },
  {
    hint: 'two empty grammars',
    src: 'ometa name {\n} ometa name2 <: name {\n}',
    dst: [
      'topLevel',
      [
        [ 'grammar', 'name', null, [] ],
        [ 'grammar', 'name2', 'name', [] ]
      ]
    ]
  },
  {
    hint: 'grammar with one rule',
    src: 'ometa name { rule }',
    dst: [ 'topLevel', [ [ 'grammar', 'name', null, [ [ 'rule' ] ] ] ] ]
  }
];

units.forEach(function(unit) {
  exports[unit.hint] = function(test) {
    if (unit.throws) {
      assert.throws(function () { common.parse(unit.src) });
    } else {
      assert.deepEqual(common.parse(unit.src), unit.dst);
    }
    test.done();
  };
});
