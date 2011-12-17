var common = require('../fixtures/common'),
    assert = require('assert');

exports['lexer test'] = function(test) {
  assert.deepEqual([
    { type: 'name', value: 'abc', offset: 0 },
    { type: 'space', value: ' ', offset: 3 },
    { type: 'string', value: 'abc', offset: 4 },
    { type: 'space', value: ' ', offset: 8 },
    { type: 'string', value: '"a""bc', offset: 9 },
    { type: 'space', value: ' ', offset: 17 },
    { type: 'token', value: 'abc', offset: 18 },
    { type: 'space', value: ' ', offset: 23 },
    { type: 'punc', value: '{', offset: 24 },
    { type: 'punc', value: '}', offset: 25 },
    { type: 'space', value: ' ', offset: 26 },
    { type: 'punc', value: '[', offset: 27 },
    { type: 'string', value: 'a', offset: 28 },
    { type: 'space', value: ' ', offset: 30 },
    { type: 'punc', value: ']', offset: 31 }
  ], common.lexems('abc `abc \'"a""bc\' "abc" {} [#a ]'));

  test.done();
};
