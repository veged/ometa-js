var common = require('../fixtures/common'),
    assert = require('assert');

exports['lexer test'] = function(test) {
  assert.deepEqual([
    { type: 'name', value: 'abc', offset: 0 },
    { type: 'space', value: ' ', offset: 3 },
    { type: 'string', value: 'abc', offset: 4 },
    { type: 'name', value: 'c', offset: 7 },
    { type: 'space', value: ' ', offset: 8 },
    { type: 'token', value: 'abc', offset: 9 },
    { type: 'space', value: ' ', offset: 14 },
    { type: 'string', value: 'abc', offset: 15 },
    { type: 'space', value: ' ', offset: 20 },
    { type: 'punc', value: '{', offset: 21 },
    { type: 'punc', value: '}', offset: 22 },
    { type: 'space', value: ' ', offset: 23 },
    { type: 'punc', value: '[', offset: 24 },
    { type: 'string', value: 'a', offset: 25 },
    { type: 'name', value: 'a', offset: 26 },
    { type: 'space', value: ' ', offset: 27 },
    { type: 'punc', value: ']', offset: 28 }
  ], common.lexems('abc `abc \'abc\' "abc" {} [#a ]'));

  test.done();
};
