var core = exports;

var util = require('util');

// Grmr.prototype._rule_rule1 = function() {
//   return this.enter('rule1', 0, function() {
//            this.match('str') && this.set('a') &&
//            this.body(fn, ['a'])
//          })
// }

//
// ### function AbstractParser (source)
// #### @source {Array|String} source code
// Abstract Parser constructor
//
function AbstractParser(source) {
  this.source = source;
  this.history = [];
  this.state = {
    source: source,
    offset: 0,
    log: [],
    args: {}
  };

  // enter initial state
  this.enter('', 0);
};
core.AbstractParser = AbstractParser;

//
// ### function enter (rule)
// #### @rule {String} rule name
// #### @id {Number} match id (both rule and id may be used for caching)
// enters current position to stack
//
AbstractParser.prototype.enter = function enter(rule, id, fn) {
  this.history.push(this.state);
  this.state = {
    source: this.state.source,
    offset: this.state.offset,
    log: this.state.log.slice(),
    args: Object.create(this.state.args)
  };

  if (fn) {
    return this.leave(fn.call(this) ? true : false);
  } else {
    return true;
  }
};

//
// ### function leave (ok)
// #### @ok {Boolean} should we fail?
// leaves to previous position
//
AbstractParser.prototype.leave = function leave(ok) {
  var offset = this.state.offset,
      log = this.state.log,
      state = this.state = this.history.pop();

  // Propagate intermediate and change offset on success
  if (ok) {
    // We're assuming here that source hasn't changed
    // Because on success we should be in a same source
    this.intermediate = state.source.slice(state.offset, offset);
    state.offset = offset;
    state.log = log;

    return true;
  } else {
    return false;
  }
};

//
// ### function current ()
// Returns item at current position
//
AbstractParser.prototype.current = function current() {
  return this.state.source[this.state.offset];
};

//
// ### function skip ()
// Skips one item in list
//
AbstractParser.prototype.skip = function skip() {
  var state = this.state;

  state.offset++;

  // Close simulate
  if (state.source.length == state.offset && this.close('simulate')) {
    return true;
  }

  // Out of bounds check
  if (state.source.length < state.offset) {
    state.source = undefined;
  }

  return true;
};

//
// ### function open (type)
// #### @type {String} either `list`, `lookahead`, `chars`, or `simulate`
// opens array at current position
//
AbstractParser.prototype.open = function open(type) {
  var state = this.state,
      next;

  // Check if we can go deeper into current value
  if (type === 'list') {
    next = this.current();

    // Value should be sequencable
    if (!Array.isArray(next) && typeof next !== 'string') {
      return false;
    }
  }

  state.log.push({ source: state.source, offset: state.offset, type: type });

  // List should go deeper
  if (type === 'list') {
    state.source = next;
    state.offset = 0;
  }

  return true;
};

//
// ### function close (type)
// #### @type {String} either `list`, `lookahead`, `chars`, or `simulate`
// Returns back from array matching
//
AbstractParser.prototype.close = function close(type) {
  var state = this.state,
      entry = state.log.pop();

  if (!entry) return false;

  // Type should be same as was passed to .open() before
  if (entry.type !== type) {
    state.log.push(entry);
    return false;
  }

  // If we're closing list - ensure that we reached it's end
  if (entry.type === 'list' && state.source.length !== state.offset) {
    return false;
  }

  var original = state.source;

  state.source = entry.source;
  state.offset = entry.offset;

  for (var i = 0; i < this.history.length; i++) {
    if (this.history[i].source === original) {
      this.history[i].source = entry.source;
      this.history[i].offset = entry.offset;
    }
  }

  // Handle [ ... ]:argname
  this.intermediate = this.current();

  // Skip current item if we just left list
  if (entry.type === 'list') {
    // Go to next item
    this.skip();
  }

  return true;
};

function genericMatch(parser, fn) {
  var state = parser.state,
      curr = parser.current();

  if (fn.call(parser, curr)) {
    // Move to next item
    parser.skip();
    parser.intermediate = curr;
    return true;
  } else {
    return false;
  }
};

//
// ### function match (str)
// #### @str {String} chunk of string to match
//
AbstractParser.prototype.match = function match(str) {
  return genericMatch(this, function(curr) {
    return curr === str;
  });
};

//
// ### function space ()
// Matches a single space
//
AbstractParser.prototype.space = function space() {
  return genericMatch(this, function(curr) {
    return /\s/.test(curr);
  });
};

//
// ### function spaces ()
// Matches sequence of spaces
//
AbstractParser.prototype.spaces = function spaces() {
  while (this.space()) {};
  return true;
};

//
// ### function fromTo (from, to)
// Matches sequence starting with `from` and ending with `to`
//
AbstractParser.prototype.fromTo = function fromTo(from, to) {
  var source = this.state.source,
      start = source.indexOf(from, this.state.offset),
      end = source.indexOf(to, this.state.offset);

  if (start === -1 || end === -1) return false;
  end += to.length;

  this.intermediate = source.slice(start, end);
  this.state.offset = end;

  return true;
};

//
// ### function anything (str)
// #### @str {String} chunk of string to match
//
AbstractParser.prototype.anything = function anything(str) {
  return genericMatch(this, function(curr) {
    return true;
  });
};

//
// ### function range (from, to)
// #### @from {any} minimum value
// #### @to {any} maximum value
// Matches entries which are `from <= entry <= to`
//
AbstractParser.prototype.range = function range(from, to) {
  return genericMatch(this, function(curr) {
    return from <= curr && curr <= to;
  });
};

//
// ### function set (name)
// #### @name {String} argument name
// Sets argument's value to current intermediate value
//
AbstractParser.prototype.set = function set(name) {
  var state = this.state;
  state.args[name] = this.intermediate;

  return true;
};

//
// ### function get (name)
// #### @name {String} argument name
// Gets argument's value
//
AbstractParser.prototype.get = function get(name) {
  return this.state.args[name];
};

//
// A helper method (just for DRY)
//
function invokeCode(code, args) {
  var self = this;

  return code.apply(this, args.map(function(key) {
    return self.get(key);
  }));
};

//
// ### function simulate (fn, args)
// #### @fn {Function} which result we'll use as current source
// #### @args {Array} args to pass to function
// Runs function and uses it return value as source code (until .leave())
//
AbstractParser.prototype.simulate = function simulate(fns, args) {
  var result = fns.map(function(fn) {
    return invokeCode(fn, args);
  });

  if (this.open('simulate')) {
    this.state.source = result;
    this.state.offset = 0;
    return true;
  } else {
    return false;
  }
};

//
// ### function predicate (fn, args)
// #### @fn {Function} which result we'll use
// #### @args {Array} args to pass to function
// Runs function and allows outer code to continue if result is true
//
AbstractParser.prototype.predicate = function predicate(fn, args) {
  return invokeCode(fn, args) ? true : false;
};

//
// ### function body (code)
// #### @code {Function} host language code
// #### @args {Array} arguments to pass to function
// Calls host language code and sets result into `intermediate` value
//
AbstractParser.prototype.body = function body(code, args) {
  this.intermediate = invokeCode(code, args);
  return true;
};

//
// ### function result (code)
// #### @result {Function} host language code
// #### @args {Array} arguments to pass to function
// Calls host language code and sets result into `result` value
//
AbstractParser.prototype.result = function result(code, args) {
  this.result = this.intermediate = invokeCode(code, args);
  return true;
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
  return this.enter('token', 0, function() {
    if (!this.anything()) return false;
    var token = this.intermediate;

    // Match chars
    for (var i = 0; i < token.length; i++) {
      if (!this.match(token[i])) return false;
    }

    // Match whitespace after token and close 'chars'
    if (this.spaces()) {
      this.result = token;
      return true;
    } else {
      return false;
    }
  })
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
  return this.enter('anything', 0, function() {
    return propagateResult(this, function() {
      return this.anything();
    });
  });
};

//
// ### function _rule_space ()
// Default `space` rule implementation
//
AbstractGrammar.prototype._rule_space = function _rule_space() {
  return this.enter('space', 0, function() {
    return propagateResult(this, function() {
      return this.space();
    });
  });
};

//
// ### function _rule_spaces ()
// Default `spaces` rule implementation
//
AbstractGrammar.prototype._rule_spaces = function _rule_spaces() {
  return this.enter('space', 0, function() {
    return propagateResult(this, function() {
      return this.spaces();
    });
  });
};

//
// ### function _rule_fromTo ()
// Default `fromTo` rule implementation
//
AbstractGrammar.prototype._rule_fromTo = function fromTo() {
  return this.enter('fromTo', 0, function() {
    return propagateResult(this, function() {
      if (!this.anything()) return false;
      var from = this.intermediate;
      if (!this.anything()) return false;
      var to = this.intermediate;

      var res =  this.fromTo(from, to);

      return res;
    });
  });
};
