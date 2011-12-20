var common = require('../fixtures/common'),
    assert = require('assert');

exports['empty grammar without parent'] = function(test) {
  var code = common.compile('ometa G {}');
  assert.equal(
    code,
    'function G(source) {AbstractGrammar.call(this, source);};' +
    'require("util").inherits(G,AbstractGrammar);'
  );
  test.done();
};

exports['empty grammar with parent'] = function(test) {
  var code = common.compile('ometa G <: P {}');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);'
  );
  test.done();
};

exports['grammar with one empty rule'] = function(test) {
  var code = common.compile('ometa G <: P { a }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return this.enter("a",0) && this.leave()' +
    '};'
  );
  test.done();
};

exports['grammar with two empty rules'] = function(test) {
  var code = common.compile('ometa G <: P { a, b }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return this.enter("a",0) && this.leave()' +
    '};' +
    'G.prototype._rule_b = function _rule_b() {' +
    'return this.enter("b",0) && this.leave()' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a match'] = function(test) {
  var code = common.compile('ometa G <: P { a :b }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return this.enter("a",0) && ' +
    'this._rule_anything() && this.set("b") && ' +
    'this.leave()' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two matches'] = function(test) {
  var code = common.compile('ometa G <: P { a :b :c }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return ' +
    'this.enter("a",0) && ' +
    'this._rule_anything() && this.set("b") && ' +
    'this._rule_anything() && this.set("c") && ' +
    'this.leave()' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two choices'] = function(test) {
  var code = common.compile('ometa G <: P { a = (:b | :c) }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return ' +
    'this.enter("a",0) && ' +
    '((this._rule_anything() && this.set("b")) || ' +
    '(this._rule_anything() && this.set("c"))) && ' +
    'this.leave()' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two choices and predicate'] = function(test) {
  var code = common.compile('ometa G <: P { a = :p (:b | :c) }');
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
    'return ' +
    'this.enter("a",0) && ' +
    '(this._rule_anything() && this.set("p") && ' +
    '((this._rule_anything() && this.set("b")) || ' +
    '(this._rule_anything() && this.set("c")))) && ' +
    'this.leave()' +
    '};'
  );
  test.done();
};
