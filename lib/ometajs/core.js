var core = exports;

var util = require('util');

// Grmr.prototype._rule_rule1 = function() {
//   var a;
//   return this.match('str') &&
//          this.store(function(_) {a = _}) &&
//          this.exec(function() { return 'prefix-' + a })
// }
//
// this.simulate([...data...], function() {
//   this.atomic(function() {
//     this.match(...all data...)
//   }) && this.match(...next data...)
// })

//
// ### function AbstractParser (source)
// #### @source {Array|String} source code
// Abstract Parser constructor
//
function AbstractParser(source) {
  // Allocate rule cache for left recursion and overall speedup
  this._cache = {};

  // Store source and current position
  this.source = source;
  this.offset = 0;

  // Remember type of stream (string, array or stream)
  this.type = this._type(source);

  // Allocate history for traversing through nested lists
  this.history = [];

  // Prepary property for future usage
  this.intermediate = undefined;
};
exports.AbstractParser = AbstractParser;

//
// ### function _type (source)
// #### @source {any} Input source
// Returns type of source
//
AbstractParser.prototype._type = function _type(source) {
  if (Array.isArray(source)) return 'array';
  if (typeof source === 'string') return 'string';
  if (source instanceof Stream) return 'stream';

  throw new Error('Non-sequencable source! (source: ' + source + ' )');
};

//
// ### function _save ()
// Saves parser's state
//
AbstractParser.prototype._save = function _save() {
  return {
    source: this.source,
    offset: this.offset,
    type: this.type,
    history: this.history.slice(),
    simulated: this.simulated
  };
};

//
// ### function _load (state)
// #### @state {Object} state
// Loads parser's state
//
AbstractParser.prototype._load = function _load(state) {
  this.source = state.source;
  this.offset = state.offset;
  this.type = state.type;
  this.history = state.history;
  this.simulated = state.simulated;
};

//
// ### function cache (rule, body)
// #### @rule {String} rule name
// #### @body {Function} rule's body
// Caches rule results and allows left recursion
//
AbstractParser.prototype.cache = function cache(rule, body) {
  // Simulates can't be cached
  // And left recursion isn't supported here too
  if (this.simulated) return body.call(this);

  // TODO: Implement me
  return body.call(this);
};

//
// ### function atomic (body, lookahead)
// #### @body {Function} rule's body
// #### @lookahead {Boolean} if true - don't move index even after success
// Starts atomic operation which can either fail or success
// (won't be commited partially)
//
AbstractParser.prototype.atomic = function atomic(body, lookahead) {
  var state = this._save(),
      result = body.call(this);

  // Restore state on body fail or if we was doing lookahead
  if (!result || lookahead) {
    // Leave ended streams
    if (state.type === 'stream') {
      var s = source.leave();
      if (s) state = s;
    }

    this._load(state);
  }

  return result;
};

//
// ### function list (body)
// #### @body {Function} rule's body
// Enters array at current position (if there are any)
// Will leave array automatically on body's fail or success
//
AbstractParser.prototype.list = function list(body) {
  var current = this.current(),
      res;

  if (!Array.isArray(current)) return false;

  this.atomic(function() {
    // Move into list
    this.history.push(this.offset);
    this.source = current;
    this.offset = 0;
    this.type = this._type(current);

    // And invoke body
    res = body.call(this) &&
    // If we successfully matched body - ensure that it was fully matched
          this.offset === current.length;

    // Fail to restore all state
    return false;
  });

  if (res) {
    // Skip current item as we matched it
    this.skip();
  }

  return res;
};

//
// ### function store (body, callback)
// #### @body {Function} rule's body
// #### @callback {Function} function that'll receive value
// Should be used to store intermediate value (from expression or match)
//
AbstractParser.prototype.store = function store(body, callback) {
  var res = body.call(this);

  if (res) callback.call(this, this.intermediate);

  return res;
};

//
// ### function simulate (source)
// #### @source {Array} data array
// Prepends source to the current one
//
AbstractParser.prototype.simulate = function simulate(source, body) {
  if (!Array.isArray(source)) {
    throw new Error('Only arrays can be prepended to the current source');
  }

  // Get all function's values
  for (var i = 0; i < source.length; i++) {
    source[i] = source[i].call(this);
  }

  return this.atomic(function() {
    new Stream(this, source);
    this.simulated = true;

    return body.call(this);
  });
};

//
// ### function setIntermediate (value)
// #### @value {any}
// Internal functions, should be called to set intermediate value
//
AbstractParser.prototype.setIntermediate = function setIntermediate(value) {
  this.intermediate = value;
};

//
// ### function match (fn)
// #### @fn {String|Function} matcher function or value to match
//
AbstractParser.prototype.match = function match(fn) {
  if (typeof fn !== 'function') {
    return this.match(function(value) {
      return value === fn;
    });
  }

  if (fn.call(this, this.current())) {
    this.skip();
    return true;
  } else {
    return false;
  }
};

//
// ### function current ()
// Returns value at the current index
//
AbstractParser.prototype.current = function current() {
  if (this.type === 'string' || this.type === 'array') {
    return this.source[this.offset];
  } else if (this.type === 'stream') {
    return this.source.get();
  }
};

//
// ### function skip ()
// Skips element in current source
//
AbstractParser.prototype.skip = function skip() {
  if (this.type === 'string' || this.type === 'array') {
    this.offset++;
  } else if (this.type === 'stream') {
    this.source.skip();
  }
};

//
// ### function Stream (parser, source)
// #### @parser {Parser}
// #### @source {Array|String|Stream} Source
// Streams constructor
//
function Stream(parser, source) {
  this.original = parser.state();
  this.parser = parser;

  this.offset = 0;
  this.source = source;
  this.ended = false;

  parser.source = this;
  parser.offset = 0;
}

//
// ### function get ()
// Gets current item in the stream
//
Stream.prototype.get = function get() {
  return this.source[this.offset];
};

//
// ### function skip ()
// Skips element in stream
//
Stream.prototype.skip = function skip() {
  this.offset++;

  if (this.offset === this.source.length) {
    this.ended = true;
    this.parser._load(this.original);
  }
};

//
// ### function leave ()
// Leaves state until non-stream or not ended stream
//
Stream.prototype.leave = function leave() {
  if (!this.ended) return false;

  var state = this.original,
      t;

  while (state.type === 'stream' && (t = state.source.leave())) {
    state = t;
  }

  return state;
};

//
// ### function AbstractGrammar (source)
// #### @source {Array|String} source code
// Abstract Grammar constructor
//
function AbstractGrammar(source) {
  AbstractParser.call(this, source);
}
util.inherits(AbstractGrammar, AbstractParser);
core.AbstractGrammar = AbstractGrammar;

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
