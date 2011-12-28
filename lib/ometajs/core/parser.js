//
// ### function AbstractParser (source)
// #### @source {Array|String} source code
// Abstract Parser constructor
//
function AbstractParser(source) {
  // Allocate rule cache for left recursion and overall speedup
  this._cache = new Array(source.length);

  // Store source and current position
  this.source = source;
  this.offset = 0;

  // Remember type of stream (string, array or simulate)
  this.type = this._type(source);

  // Allocate history for traversing through nested lists
  this.history = [];

  // Prepary property for future usage
  this.intermediate = undefined;
  this.result = undefined;

  // Some state info
  this.simulated = false;
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
    result: this.result,
    simulated: this.simulated
  };
};

//
// ### function _load (state)
// #### @state {Object} state
// #### @values {Boolean} should load intermediate and result?
// Loads parser's state
//
AbstractParser.prototype._load = function _load(state, values) {
  this.source = state.source;
  this.offset = state.offset;
  this.type = state.type;
  this.history = state.history;
  if (values) {
    this.intermediate = state.intermediate;
    this.result = state.result;
  }
  this.simulated = state.simulated;
};

//
// ### function cache (grammar, rule, body)
// #### @grammar {String} grammar name
// #### @rule {String} rule name
// #### @body {Function} rule's body
// Caches rule results and allows left recursion
//
AbstractParser.prototype.cache = function cache(grammar, rule, body) {
  // Simulates can't be cached
  // And left recursion isn't supported here too
  if (this.simulated || grammar === 'AbstractGrammar') return body.call(this);

  var key = this.history.length > 0 ? this.history.concat(
        grammar,
        rule
      ).join(':') : grammar + ':' + rule,
      // Fast offset level
      cacheLevel = this._cache[this.offset] || (this._cache[this.offset] = {}),
      cache,
      res;

  // Slower history level
  cache = cacheLevel[key];


  if (cache) {
    // Indicate that left recursion was met
    if (cache.lr) {
      cache.detected = true;
    }

    // If result is positive - move position to cached one
    if (res = cache.result) this._load(cache.state, true);
  } else {
    cacheLevel[key] = cache = {
      lr: true,
      detected: false,
      result: false,
      state: this._save()
    };

    res = body.call(this);

    cacheLevel[key] = {
      lr: false,
      result: res,
      state: this._save()
    };

    // Left recursion detected
    if (res && cache.detected) {
      var source = this.source,
          offset = this.offset;

      do {
        // Return to previous position and start seeding
        this._load(cache.state);

        res = body.call(this);

        if (source === this.source && offset === this.offset) res = false;

        if (res) {
          cacheLevel[key] = {
            lr: false,
            result: res,
            state: this._save()
          }
        }
      } while (res);

      var state = cacheLevel[key].state;
      res = true;

      this._load(state, true);
    }

  }

  return res;
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
  } else if (this.result) {
    this.setIntermediate(this.result);
  } else {
    this.setIntermediate(source.slice(offset, this.offset));
  }

  return status;
};

//
// ### function list (body)
// #### @body {Function} rule's body
// #### @flat {Boolean} true if it should not go deeper
// Enters an array or string at the current position (if there are any)
// Will leave array automatically on body's fail or success
//
AbstractParser.prototype.list = function list(body, flat) {
  var current = this.current(),
      res;

  if (!Array.isArray(current) && typeof current !== 'string') return false;

  this.atomic(function() {
    if (!flat) {
      // Move into list
      this.history.push(this.offset);
      this.source = current;
      this.offset = 0;
      this.type = this._type(current);
    }

    // And invoke body
    res = body.call(this) &&
    // If we successfully matched body - ensure that it was fully matched
          (flat || this.offset === current.length);

    // Fail to restore all state
    return flat && res;
  });

  if (!flat && res) {
    // Skip current item as we matched it
    this.skip();
  }

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

  return this.atomic(function() {
    new Simulate(this, source);
    this.simulated = true;

    return body.call(this);
  });
};

//
// ### function setIntermediate (value)
// #### @value {any}
// #### @result {Boolean} should we propagate value to the end of rule
// Internal functions, should be called to set intermediate value
//
AbstractParser.prototype.setIntermediate = function setIntermediate(value,
                                                                    result) {
  if (result) this.result = value;
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
// ### function exec (fn)
// #### @fn {Function} host code to execute
// Executes host code and sets intermediate value to it's result
//
AbstractParser.prototype.exec = function exec(result) {
  this.setIntermediate(result, true);

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
// ### function isEnd ()
// Returns true if input source ended
//
AbstractParser.prototype.isEnd = function isEnd() {
  return this.source.length <= this.offset;
};

//
// ### function skip (num)
// #### @num {Number} number of entries to skip
// Skips element in current source
//
AbstractParser.prototype.skip = function skip(num) {
  if (this.type === 'string' || this.type === 'array') {
    if (num) this.offset += num - 1;
    this.setIntermediate(this.current());
    this.offset++;
  } else if (this.type === 'simulate') {
    this.source.skip(num);
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
// ### function skip (num)
// #### @num {Number} number of entries to skip
// Skips element in simulate
//
Simulate.prototype.skip = function skip(num) {
  if (num) this.offset += num - 1;
  this.parser.intermediate = this.get();
  this.offset++;

  if (this.offset >= this.source.length) {
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
