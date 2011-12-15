var common = require('../fixtures/common'),
    assert = require('assert');

var units = [
  { src: 'ometa', throws: true },
  { src: 'ometa name {', throws: true },
  { src: 'ometa name <: { }', throws: true },
  { src: 'name {}', throws: true },
  {
    src: 'ometa name {\n}',
    dst: [ 'topLevel', [ [ 'grammar', 'name', null, [] ] ] ]
  },
  {
    src: 'ometa name {\n} ometa name2 <: name {\n}',
    dst: [
      'topLevel',
      [
        [ 'grammar', 'name', null, [] ],
        [ 'grammar', 'name2', 'name', [] ]
      ]
    ]
  }
];

exports['parser test'] = function(test) {
  units.forEach(function(unit) {
    if (unit.throws) {
      assert.throws(function () { common.parse(unit.src) });
    } else {
      assert.deepEqual(common.parse(unit.src), unit.dst);
    }
  });

  test.done();
};
