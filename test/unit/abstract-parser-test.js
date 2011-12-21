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
    return this.open('list') && this.close();
  }));

  test.done();
};

exports['non-empty list against empty'] = function(test) {
  var p = common.ap([[ 1 ]]);
  assert.ok(!(
    p.enter('rule', 0, function() {
      return this.open('list') && this.close();
    })
  ));

  test.done();
};

exports['number against list match'] = function(test) {
  var p = common.ap([ 1 ]);
  assert.ok(!(
    p.enter('rule', 0, function() {
      return this.open('list') && this.match(1) && this.close();
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
             this.close()
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
             this.close() &&
             this.match(4) &&
             this.close()
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
             this.close() &&
             this.match(4) &&
             this.close()
    })
  ));

  test.done();
};

exports['propagated intermediate'] = function(test) {
  var p = common.ap('abc');
  assert.ok(
    p.enter('rule', 0, function() {
      var res = (this.enter('rule', 1, function() {
        return this.match('1');
      }) || this.enter('rule', 2, function() {
        return this.match('a') && this.match('c');
      }) || this.enter('rule', 3, function() {
        return this.match('a') && this.match('b');
      })) &&
      this.set('a') &&
      this.match('c');

      assert.equal(this.get('a'), 'ab');

      return res;
    })
  );

  test.done();
};
