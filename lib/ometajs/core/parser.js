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

  // Remember type of stream (string, array or simulate)
  this.type = this._type(source);

  // Allocate history for traversing through nested lists
  this.history = [];

  // Prepary property for future usage
  this.intermediate = undefined;
};
module.exports = AbstractParser;

//
// ### function _type (source)
// #### @source {any} Input source
// Returns type of source
//
AbstractParser.prototype._type = function _type(source) {
  if (Array.isArray(source)) return 'array';
  if (typeof source === 'string') return 'string';
  if (source instanceof Simulate) return 'simulate';

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
    intermediate: this.intermediate,
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
  this.intermediate = this.intermediate;
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
      source = this.source,
      offset = this.offset,
      status = body.call(this);

  // Restore state on body fail or if we was doing lookahead
  if (!status || lookahead) {
    // Leave ended simulates
    if (state.type === 'simulate') {
      var s = source.leave();
      if (s) state = s;
    }

    this._load(state);
  } else {
    this.setIntermediate(source.slice(offset, this.offset));
  }

  return status;
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
// ### function store (callback)
// #### @callback {Function} function that'll receive value
// Should be used to store intermediate value (from expression or match)
//
AbstractParser.prototype.store = function store(callback) {
  callback.call(this, this.intermediate);
  return true;
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
    new Simulate(this, source);
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
  if (this.type === 'string') {
    if (Array.isArray(value)) {
      this.intermediate = value.join('');
    } else if (value === undefined || value === null) {
      this.intermediate = '';
    } else {
      this.intermediate = value.toString();
    }
  } else {
    this.intermediate = value;
  }
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
// ### function predicate (fn)
// #### @fn {Function} fail if function result is false
//
AbstractParser.prototype.predicate = function match(fn) {
  return fn.call(this);
};

//
// ### function exec (fn)
// #### @fn {Function} host code to execute
// Executes host code and sets intermediate value to it's result
//
AbstractParser.prototype.exec = function exec(fn) {
  this.setIntermediate(fn.call(this));

  return true;
};

//
// ### function current ()
// Returns value at the current index
//
AbstractParser.prototype.current = function current() {
  if (this.type === 'string' || this.type === 'array') {
    return this.source[this.offset];
  } else if (this.type === 'simulate') {
    return this.source.get();
  }
};

//
// ### function skip ()
// Skips element in current source
//
AbstractParser.prototype.skip = function skip() {
  if (this.type === 'string' || this.type === 'array') {
    this.setIntermediate(this.current());
    this.offset++;
  } else if (this.type === 'simulate') {
    this.source.skip();
  }
};

//
// ### function Simulate (parser, source)
// #### @parser {Parser}
// #### @source {Array|String|Simulate} Source
// Simulates constructor
//
function Simulate(parser, source) {
  this.original = parser._save();
  this.parser = parser;

  this.offset = 0;
  this.source = source;
  this.ended = false;

  parser.source = this;
  parser.type = parser._type(this);
  parser.offset = 0;
}

//
// ### function get ()
// Gets current item in the simulate
//
Simulate.prototype.get = function get() {
  return this.source[this.offset];
};

//
// ### function skip ()
// Skips element in simulate
//
Simulate.prototype.skip = function skip() {
  this.parser.intermediate = this.get();
  this.offset++;

  if (this.offset === this.source.length) {
    this.ended = true;
    this.parser._load(this.original);
  }
};

//
// ### function slice(from, to)
// #### @from {Number} from index
// #### @to {Number} to index
// Returns concatenated source
//
Simulate.prototype.slice = function slice(from, to) {
  var result = this.source.slice(from, to);

  if (to > this.source.length) {
    result.concat(this.original.source.slice(0, to - this.source.length));
  }

  return result;
};

//
// ### function leave ()
// Leaves state until non-simulate or not ended simulated
//
Simulate.prototype.leave = function leave() {
  if (!this.ended) return false;

  var state = this.original,
      t;

  while (state.type === 'simulate' && (t = state.source.leave())) {
    state = t;
  }

  return state;
};
