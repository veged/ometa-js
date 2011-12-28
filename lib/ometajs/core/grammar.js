var ometajs = require('../../ometajs'),
    util = require('util');

//
// ### function AbstractGrammar (source)
// #### @source {Array|String} source code
// Abstract Grammar constructor
//
function AbstractGrammar(source) {
  ometajs.core.AbstractParser.call(this, source);
  this.name = 'AbstractGrammar';
}
util.inherits(AbstractGrammar, ometajs.core.AbstractParser);
module.exports = AbstractGrammar;

AbstractGrammar.prototype._invoke = function _invoke(grmr, rule, args) {
  function invoke() {
    this.result = undefined;
    var res = grmr.prototype['_rule_' + rule].call(this);
    if (res && this.result !== undefined) {
      this.setIntermediate(this.result);
    }
    return res;
  }

  if (args) {
    var self = this;
    return this.simulate(args, invoke);
  } else {
    return this.cache(grmr.name, rule, invoke);
  }
};

//
// ### function rule (name, args)
// #### @name {String} rule name
// #### @args {Array} (optional) arguments
//
//
AbstractGrammar.prototype.rule = function rule(name, args) {
  return this._invoke(this.constructor, name, args);
};

//
// ### function super (name, args)
// #### @name {String} rule name
// #### @args {Array} (optional) arguments
//
//
AbstractGrammar.prototype._super = function _super(name, args) {
  return this._invoke(this.constructor.super_, name, args);
};

//
// ### function fromTo (from, to)
// #### @from {any}
// #### @to {any}
// Tries to match content between `from` and `to`
//
AbstractGrammar.prototype.fromTo = function fromTo(from, to) {
  var f = this.source.indexOf(from),
      t = this.source.indexOf(to);

  if (f !== this.offset || t === -1) return false;

  t += to.length;

  var value = this.source.slice(f, t);
  while (t-- > f) {
    this.skip();
  }

  this.setIntermediate(value);

  return true;
};

//
// ### function seq (str)
// #### @str {String}
// Tries to match chars sequence
//
AbstractGrammar.prototype.seq = function seq(str) {
  for (var i = 0; i < str.length; i++) {
    if (!this.match(str[i])) return false;
  }

  return true;
};

//
// ### function any (fn)
// #### @fn {Function} function to iterate with
// Greedy matcher, count >= 0
//
AbstractGrammar.prototype.any = function any(fn) {
  var list = [];

  while (!this.isEnd() && fn.call(this)) {
    list.push(this.intermediate);
  }

  this.setIntermediate(list);

  return true;
};

//
// ### function many (fn)
// #### @fn {Function} function to iterate with
// Greedy matcher, count > 0
//
AbstractGrammar.prototype.many = function many(fn) {
  var list = [];

  if (!fn.call(this)) return false;
  list.push(this.intermediate);

  while (!this.isEnd() && fn.call(this)) {
    list.push(this.intermediate);
  }

  this.setIntermediate(list);

  return true;
};

//
// ### function optional (fn)
// #### @fn {Function} function to iterate with
// Match, or at least not fail
//
AbstractGrammar.prototype.optional = function optional(fn) {
  if (!fn.call(this)) {
    this.setIntermediate(undefined);
  }

  return true;
};

//
// ### function _rule_token ()
// Default token rule implementation
//
AbstractGrammar.prototype._rule_token = function _rule_token() {
  if (!this.rule('anything')) return false;
  var token = this.intermediate;

  // Match whitespace after token and close 'chars'
  if (this.seq(token) && this.rule('spaces')) {
    this.setIntermediate(token, true);
    return true;
  } else {
    this.intermediate = undefined;
    return false;
  }
};

//
// ### function _rule_anything ()
// Default `anything` rule implementation
//
AbstractGrammar.prototype._rule_anything = function _rule_anything() {
  return this.match(function() { return true });
};

//
// ### function _rule_space ()
// Default `space` rule implementation
//
AbstractGrammar.prototype._rule_space = function _rule_space() {
  return this.match(function(v) { return /^\s$/.test(v) });
};

//
// ### function _rule_spaces ()
// Default `spaces` rule implementation
//
AbstractGrammar.prototype._rule_spaces = function _rule_spaces() {
  return this.any(function() {
    return this.rule('space');
  });
};

//
// ### function _rule_fromTo ()
// Default `fromTo` rule implementation
//
AbstractGrammar.prototype._rule_fromTo = function _rule_fromTo() {
  if (!this.rule('anything')) return false;
  var from = this.intermediate;
  if (!this.rule('anything')) return false;
  var to = this.intermediate;

  return this.fromTo(from, to);
};

//
// ### function _rule_char ()
// Default `char` rule implementation
//
AbstractGrammar.prototype._rule_char = function _rule_char() {
  return this.match(function(curr) {
    return typeof curr === 'string' &&
           curr.length == 1;
  });
};

//
// ### function _rule_letter ()
// Default `letter` rule implementation
//
AbstractGrammar.prototype._rule_letter = function _rule_letter() {
  return this.match(function(curr) {
    return /^[a-zA-Z]$/.test(curr);
  });
};

//
// ### function _rule_letter ()
// Default `digit` rule implementation
//
AbstractGrammar.prototype._rule_digit = function _rule_digit() {
  return this.match(function(curr) {
    return /^\d$/.test(curr);
  });
};

//
// ### function _rule_seq ()
// Default `seq` rule implementation
//
AbstractGrammar.prototype._rule_seq = function _rule_seq() {
  if (!this.rule('anything')) return;
  var seq = this.intermediate;

  return this.seq(seq);
};

//
// ### function _rule_listOf ()
// Default `listOf` rule implementation
//
AbstractGrammar.prototype._rule_listOf = function _rule_listOf() {
  if (!this.rule('anything')) return;
  var rule = this.intermediate;

  if (!this.rule('anything')) return;
  var sep = this.intermediate;

  if (!this.rule(rule)) return false;
  var list = [this.intermediate];

  while (this.seq(sep)) {
    if (!this.rule(rule)) return false;
    list.push(this.intermediate);
  }

  this.setIntermediate(list);

  return true;
};

//
// ### function _rule_empty ()
// Default `empty` rule implementation
//
AbstractGrammar.prototype._rule_empty = function _rule_empty() {
  return true;
};

//
// ### function _rule_end ()
// Default `end` rule implementation
//
AbstractGrammar.prototype._rule_end = function _rule_end() {
  return this.isEnd();
};
