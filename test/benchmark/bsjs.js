var common = require('../fixtures/common'),
    assert = require('assert');

var n = 1000,
    source  = new Array(n).join('if (x) { return { x:3, y:4, z:5} };');
console.log('Source length: %d', source.length);

var grmr = common.require('bs-js-compiler').BSJSParser,
    instance = new grmr(source);

console.time('parse');
instance.rule('_rule_topLevel');
console.timeEnd('parse');
