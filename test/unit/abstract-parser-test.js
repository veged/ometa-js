var common = require('../fixtures/common'),
    assert = require('assert');

exports['just string'] = function(test) {
  var p = common.ap('123');
  assert.ok(p.enter('rule', 0) &&
            p.match('1') &&
            p.match('2') &&
            p.match('3') &&
            p.leave());

  test.done();
};

exports['empty list'] = function(test) {
  var p = common.ap([[]]);
  assert.ok(p.enter('rule', 0) && p.open('list') && p.close() && p.leave());

  test.done();
};

exports['non-empty list against empty'] = function(test) {
  var p = common.ap([[ 1 ]]);
  assert.ok(!(
    p.enter('rule', 0) && p.open('list') && p.close() && p.leave()
  ));

  test.done();
};

exports['number against list match'] = function(test) {
  var p = common.ap([ 1 ]);
  assert.ok(!(
    p.enter('rule', 0) && p.open('list') && p.match(1) && p.close() && p.leave()
  ));

  test.done();
};

exports['non-empty list'] = function(test) {
  var p = common.ap([[ 1, 2, 3 ]]);
  assert.ok(
    p.enter('rule', 0) && p.open('list') &&
    p.match(1) && p.match(2) && p.match(3) &&
    p.close() && p.leave()
  );

  test.done();
};

exports['nested list'] = function(test) {
  var p = common.ap([[ 1, [ 2, 3 ], 4 ]]);
  assert.ok(
    p.enter('rule', 0) && p.open('list') &&
    p.match(1) &&
    p.open('list') &&
    p.match(2) && p.match(3) &&
    p.close() &&
    p.match(4) &&
    p.close() && p.leave()
  );

  test.done();
};

exports['nested list (not full match)'] = function(test) {
  var p = common.ap([[ 1, [ 2, 3 ], 4, 5 ]]);
  assert.ok(!(
    p.enter('rule', 0) && p.open('list') &&
    p.match(1) &&
    p.open('list') &&
    p.match(2) && p.match(3) &&
    p.close() &&
    p.match(4) &&
    p.close() && p.leave()
  ));

  test.done();
};
