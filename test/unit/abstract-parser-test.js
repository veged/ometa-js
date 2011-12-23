var common = require('../fixtures/common'),
    assert = require('assert');

exports['just string'] = function(test) {
  var p = common.ap('123');
  assert.ok(p.enter('rule', 0, function() {
    return this.match('1') && this.match('2') && this.match('3');
  }));

  test.done();
};

exports['empty list'] = function(test) {
  var p = common.ap([[]]);
  assert.ok(p.enter('rule', 0, function(){
    return this.open('list') && this.close('list');
  }));

  test.done();
};

exports['non-empty list against empty'] = function(test) {
  var p = common.ap([[ 1 ]]);
  assert.ok(!(
    p.enter('rule', 0, function() {
      return this.open('list') && this.close('list');
    })
  ));

  test.done();
};

exports['number against list match'] = function(test) {
  var p = common.ap([ 1 ]);
  assert.ok(!(
    p.enter('rule', 0, function() {
      return this.open('list') && this.match(1) && this.close('list');
    })
  ));

  test.done();
};

exports['non-empty list'] = function(test) {
  var p = common.ap([[ 1, 2, 3 ]]);
  assert.ok(
    p.enter('rule', 0, function() {
      return this.open('list') &&
             this.match(1) && this.match(2) && this.match(3) &&
             this.close('list')
    })
  );

  test.done();
};

exports['nested list'] = function(test) {
  var p = common.ap([[ 1, [ 2, 3 ], 4 ]]);
  assert.ok(
    p.enter('rule', 0, function() {
      return this.open('list') &&
             this.match(1) &&
             this.open('list') &&
             this.match(2) && this.match(3) &&
             this.close('list') &&
             this.match(4) &&
             this.close('list')
    })
  );

  test.done();
};

exports['nested list (not full match)'] = function(test) {
  var p = common.ap([[ 1, [ 2, 3 ], 4, 5 ]]);
  assert.ok(!(
    p.enter('rule', 0, function() {
      return this.open('list') &&
             this.match(1) &&
             this.open('list') &&
             this.match(2) && this.match(3) &&
             this.close('list') &&
             this.match(4) &&
             this.close('list')
    })
  ));

  test.done();
};

exports['propagated intermediate'] = function(test) {
  var p = common.ap('abc'),
      a;
  assert.ok(
    p.enter('rule', 0, function() {
      var res = (this.enter('rule', 1, function() {
        return this.match('1');
      }) || this.enter('rule', 2, function() {
        return this.match('a') && this.match('c');
      }) || this.enter('rule', 3, function() {
        return this.match('a') && this.match('b');
      })) &&
      this.get(function(_) {a=_}) &&
      this.match('c');

      assert.equal(a, 'ab');

      return res;
    })
  );

  test.done();
};

exports['space'] = function(test) {
  var p = common.ap(' 1');

  assert.ok(p.space() && p.match('1'));

  var p2 = common.ap('1');

  assert.ok(!p.space());

  test.done();
};

exports['spaces'] = function(test) {
  var p = common.ap('       1');

  assert.ok(p.spaces() && p.match('1'));

  var p2 = common.ap('1');

  assert.ok(p.spaces());

  test.done();
};
