var common = require('../fixtures/common'),
    assert = require('assert');

exports['lexer test'] = function(test) {
  assert.deepEqual([
    { type: 'name', value: 'abc', offset: 0 },
    { type: 'string', value: 'abc', offset: 4 },
    { type: 'name', value: 'c', offset: 7 },
    { type: 'token', value: 'abc', offset: 9 },
    { type: 'string', value: 'abc', offset: 15 },
    { type: 'punc', value: '{', offset: 21 },
    { type: 'punc', value: '}', offset: 22 },
    { type: 'punc', value: '[', offset: 24 },
    { type: 'string', value: 'a', offset: 25 },
    { type: 'name', value: 'a', offset: 26 },
    { type: 'punc', value: ']', offset: 28 }
  ], common.lexems('abc `abc \'abc\' "abc" {} [#a ]'));

  test.done();
};
