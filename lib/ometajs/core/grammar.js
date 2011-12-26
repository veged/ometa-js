var ometajs = require('../../ometajs'),
    util = require('util');

//
// ### function AbstractGrammar (source)
// #### @source {Array|String} source code
// Abstract Grammar constructor
//
function AbstractGrammar(source) {
  ometajs.core.AbstractParser.call(this, source);
}
util.inherits(AbstractGrammar, ometajs.core.AbstractParser);
module.exports = AbstractGrammar;

//
// ### function rule (name, args)
// #### @name {String} rule name
// #### @args {Array} (optional) arguments
//
//
AbstractGrammar.prototype.rule = function rule(name, args) {
  return this.cache(name, function() {
    if (args) {
      return this.simulate(args, function() {
        return this['_rule_' + name]();
      });
    } else {
      return this['_rule_' + name]();
    }
  });
};

//
// ### function super (name, args)
// #### @name {String} rule name
// #### @args {Array} (optional) arguments
//
//
AbstractGrammar.prototype._super = function _super(name, args) {
  return this.enter(name, null, function() {
    if (args) {
      return this.simulate(args, function() {
        return this.constructor._super.prototype['_rule_' + name].call(this);
      });
    } else {
      return this['_rule_' + name]();
    }
  });
};

//
// ### function any (fn)
// #### @fn {Function} function to iterate with
// Greedy matcher, count >= 0
//
AbstractGrammar.prototype.any = function any(fn) {
  var list = [];

  while (fn.call(this)) {
    list.push(this.intermediate);
  }

  this.intermediate = list;

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

  while (fn.call(this)) {
    list.push(this.intermediate);
  }

  this.intermediate = list;

  return true;
};

//
// ### function optional (fn)
// #### @fn {Function} function to iterate with
// Match, or at least not fail
//
AbstractGrammar.prototype.optional = function optional(fn) {
  return fn.call(this) || true;
};

//
// ### function _rule_token ()
// Default token rule implementation
//
AbstractGrammar.prototype._rule_token = function _rule_token() {
  if (!this.anything()) return false;
  var token = this.intermediate;

  // Match whitespace after token and close 'chars'
  if (this.seq(token) && this.spaces()) {
    this.result = token;
    return true;
  } else {
    return false;
  }
};

//
// ### function propagateResult (grammar, fn)
// #### @grammar {AbstractGrammar} grammar instance
// #### @fn {Function} some parser function
// Sets .result = .intermediate
//
function propagateResult(grammar, fn) {
  if (fn.call(grammar)) {
    grammar.result = grammar.intermediate;
    return true;
  } else {
    return false;
  }
}

//
// ### function _rule_anything ()
// Default `anything` rule implementation
//
AbstractGrammar.prototype._rule_anything = function _rule_anything() {
  return propagateResult(this, function() {
    return this.anything();
  });
};

//
// ### function _rule_space ()
// Default `space` rule implementation
//
AbstractGrammar.prototype._rule_space = function _rule_space() {
  return propagateResult(this, function() {
    return this.space();
  });
};

//
// ### function _rule_spaces ()
// Default `spaces` rule implementation
//
AbstractGrammar.prototype._rule_spaces = function _rule_spaces() {
  return propagateResult(this, function() {
    return this.spaces();
  });
};

//
// ### function _rule_fromTo ()
// Default `fromTo` rule implementation
//
AbstractGrammar.prototype._rule_fromTo = function _rule_fromTo() {
  return propagateResult(this, function() {
    if (!this.anything()) return false;
    var from = this.intermediate;
    if (!this.anything()) return false;
    var to = this.intermediate;

    return this.fromTo(from, to);
  });
};

//
// ### function _rule_char ()
// Default `char` rule implementation
//
AbstractGrammar.prototype._rule_char = function _rule_char() {
  return propagateResult(this, function() {
    return genericMatch(this, function(curr) {
      return typeof curr === 'string' &&
             curr.length == 1;
    });
  });
};

//
// ### function _rule_letter ()
// Default `letter` rule implementation
//
AbstractGrammar.prototype._rule_letter = function _rule_letter() {
  return propagateResult(this, function() {
    return genericMatch(this, function(curr) {
      return /^[a-zA-Z]$/.test(curr);
    });
  });
};

//
// ### function _rule_letter ()
// Default `digit` rule implementation
//
AbstractGrammar.prototype._rule_digit = function _rule_digit() {
  return propagateResult(this, function() {
    return genericMatch(this, function(curr) {
      return /^\d$/.test(curr);
    });
  });
};

//
// ### function _rule_seq ()
// Default `seq` rule implementation
//
AbstractGrammar.prototype._rule_seq = function _rule_seq() {
  return propagateResult(this, function() {
    if (!this.anything()) return;
    var seq = this.intermediate;

    return this.seq(seq);
  });
};

//
// ### function _rule_listOf ()
// Default `listOf` rule implementation
//
AbstractGrammar.prototype._rule_listOf = function _rule_listOf() {
  return propagateResult(this, function() {
    if (!this.anything()) return;
    var rule = '_rule_' + this.intermediate;
    if (!this.anything()) return;
    var sep = this.intermediate;

    if (!this[rule]()) return false;
    var list = [this.intermediate];
    while (this.seq(sep)) {
      if (!this[rule]()) return false;
      list.push(this.intermediate);
    }

    this.intermediate = list;

    return true;
  });
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
  return this.state.source === undefined;
};
