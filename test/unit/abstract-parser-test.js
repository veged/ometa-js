var common = require('../fixtures/common'),
    assert = require('assert');

exports['basic matching'] = function(test) {
  var p = common.ap('123');

  assert.ok(p.match('1') && p.match('2') && p.match('3'));
  assert.ok(!(p.match('1')));

  test.done();
};

exports['atomic and choices'] = function(test) {
  var p = common.ap('123');

  assert.ok(p.atomic(function() {
    return this.match('1') && this.match('2') && this.match('4');
  }) || p.atomic(function() {
    return this.match('1') && this.match('2') && this.match('3');
  }));
  assert.equal(p.intermediate, '123');

  test.done();
};

exports['lookahead'] = function(test) {
  var p = common.ap('123');

  assert.ok(p.atomic(function() {
    return this.match('1');
  }, true) || p.atomic(function() {
    return this.match('1') && this.match('2') && this.match('3');
  }));

  test.done();
};

exports['nested lists'] = function(test) {
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

  test.done();
};
