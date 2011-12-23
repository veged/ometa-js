var common = require('../fixtures/common'),
    assert = require('assert');

exports['empty grammar without parent'] = function(test) {
  var code = common.compile('ometa G {}', { globals: false });
  assert.equal(
    code,
    'function G(source) {AbstractGrammar.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,AbstractGrammar);'
  );
  test.done();
};

exports['empty grammar with parent'] = function(test) {
  var code = common.compile('ometa G <: P {}', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);'
  );
  test.done();
};

exports['grammar with one empty rule'] = function(test) {
  var code = common.compile('ometa G <: P { a }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true' +
    '};'
  );
  test.done();
};

exports['grammar with two empty rules'] = function(test) {
  var code = common.compile('ometa G <: P { a, b }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true' +
    '};' +
    'G.prototype._rule_b = function _rule_b() {' +
      'return true' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a match'] = function(test) {
  var code = common.compile('ometa G <: P { a :b }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.rule("anything") && this.get(function(_) {b=_})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two matches'] = function(test) {
  var code = common.compile('ometa G <: P { a :b :c }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.rule("anything") && ' +
      'this.get(function(_) {b=_}) && ' +
      'this.rule("anything") && this.get(function(_) {c=_})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two choices'] = function(test) {
  var code = common.compile('ometa G <: P { a = (:b | :c) }', {
    globals: false
  });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.enter("a",0,function() {' +
        'return true && (this.enter("a",1,function() {' +
          'return true && this.rule("anything") && ' +
          'this.get(function(_) {b=_})' +
        '}) || this.enter("a",2,function() {' +
          'return true && this.rule("anything") && ' +
          'this.get(function(_) {c=_})' +
        '}))' +
      '})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with two choices and predicate'] = function(test) {
  var code = common.compile('ometa G <: P { a = :p (:b | :c) }', {
    globals: false
  });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.enter("a",0,function() {' +
        'return true && this.rule("anything") && ' +
        'this.get(function(_) {p=_}) && ' +
        '(this.enter("a",1,function() {' +
          'return true && this.rule("anything") && ' +
          'this.get(function(_) {b=_})' +
        '}) || this.enter("a",2,function() {' +
          'return true && this.rule("anything") && ' +
          'this.get(function(_) {c=_})' +
        '}))' +
      '})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a rule invocation'] = function(test) {
  var code = common.compile('ometa G <: P { a b }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.rule("b")' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a named rule invocation'] = function(test) {
  var code = common.compile('ometa G <: P { a b:b }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.rule("b") && this.get(function(_) {b=_})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a named choice'] = function(test) {
  var code = common.compile('ometa G <: P { a (b|c):t }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && (this.enter("a",0,function() {' +
        'return true && this.rule("b")' +
      '}) || this.enter("a",1,function() {' +
        'return true && this.rule("c")' +
      '})) && this.get(function(_) {t=_})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a rhs'] = function(test) {
  var code = common.compile('ometa G <: P { a = b :b -> "b" | c -> "c" }', {
    globals: false
  });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && (this.enter("a",0,function() {' +
        'return true && this.rule("b") && ' +
        'this.rule("anything") && ' +
        'this.get(function(_) {b=_}) && ' +
        'this.body(function() {return"b"})' +
      '}) || this.enter("a",1,function() {' +
        'return true && this.rule("c") && ' +
        'this.body(function() {return"c"})' +
      '}))' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a array match'] = function(test) {
  var code = common.compile('ometa G <: P { a = ["a" b]:c }', {
    globals: false
  });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.enter("a",0,function() {' +
        'return true && this.enter("a",1,function() {' +
          'return true && this.open("list") && ' +
          'this.rule("token",[function() {return"a"}]) && ' +
          'this.rule("b") && this.close("list")' +
        '}) && this.get(function(_) {c=_})' +
      '})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a lookahead'] = function(test) {
  var code = common.compile('ometa G <: P { a = &b :c }', { globals: false });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.enter("a",0,function() {' +
        'return true && this.open("lookahead") && this.rule("b") && ' +
        'this.close("lookahead") && ' +
        'this.rule("anything") && this.get(function(_) {c=_})' +
      '})' +
    '};'
  );
  test.done();
};

exports['grammar with rule with a chars'] = function(test) {
  var code = common.compile('ometa G <: P { a = <\'1\' \'2\'> }', {
    globals: false
  });
  assert.equal(
    code,
    'function G(source) {P.call(this, source);};' +
    'exports.G = G;' +
    'require("util").inherits(G,P);' +
    'G.prototype._rule_a = function _rule_a() {' +
      'return true && this.enter("a",0,function() {' +
        'return true && this.enter("a",1,function() {' +
          'return true && this.open("chars") && this.match("1") && ' +
          'this.match("2") && this.close("chars")' +
        '})' +
      '})' +
    '};'
  );
  test.done();
};
