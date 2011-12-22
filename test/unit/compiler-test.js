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
      'return this.enter("a",0,function(){return true})' +
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
      'return this.enter("a",0,function(){return true})' +
    '};' +
    'G.prototype._rule_b = function _rule_b() {' +
      'return this.enter("b",0,function(){return true})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this._rule_anything() && this.set("b")' +
      '})' +
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
      'return this.enter("a",0,function(){' + 
        'return true && this._rule_anything() && this.set("b") && ' +
        'this._rule_anything() && this.set("c")' +
      '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this.enter("a",1,function(){' +
          'return true && (this.enter("a",2,function(){' +
            'return true && this._rule_anything() && this.set("b")' +
          '}) || this.enter("a",3,function(){' +
            'return true && this._rule_anything() && this.set("c")' +
          '}))' +
        '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this.enter("a",1,function(){' +
          'return true && this._rule_anything() && this.set("p") && ' +
          '(this.enter("a",2,function(){' +
            'return true && this._rule_anything() && this.set("b")' +
          '}) || this.enter("a",3,function(){' +
            'return true && this._rule_anything() && this.set("c")' +
          '}))' +
        '})' +
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
      'return this.enter("a",0,function(){return true && this._rule_b()})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this._rule_b() && this.set("b")' +
      '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && (this.enter("a",1,function(){' +
          'return true && this._rule_b()' +
        '}) || this.enter("a",2,function(){' +
          'return true && this._rule_c()' +
        '})) && this.set("t")' +
      '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && (this.enter("a",1,function(){' +
          'return true && this._rule_b() && this._rule_anything() && ' +
          'this.set("b") && this.result(function(b) {return"b"}, ["b"])' +
        '}) || this.enter("a",2,function(){' +
          'return true && this._rule_c() && ' +
          'this.result(function(b) {return"c"}, ["b"])' +
        '}))' +
      '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this.enter("a",1,function(){' +
          'return true && this.enter("a",2,function(){' +
            'return true && this.open("list") && this.enter("a",3,function(){' +
              'return true && this.simulate([function() {return"a"}], []) && ' +
              'this._rule_token()' +
            '}) && this._rule_b() && this.close("list")' +
          '}) && this.set("c")' +
        '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this.enter("a",1,function(){' +
          'return true && this.enter("a",2,function(){' +
            'return true && this.open("lookahead") && this._rule_b() && ' +
            'this.close("lookahead")' +
          '}) && this.set("c")' +
        '})' +
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
      'return this.enter("a",0,function(){' +
        'return true && this.enter("a",1,function(){' +
          'return true && this.enter("a",2,function(){' +
            'return true && this.open("chars") && this.match("1") && ' +
            'this.match("2") && this.close("chars")' +
          '})' +
        '})' +
      '})' +
    '};'
  );
  test.done();
};
