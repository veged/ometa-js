var core = exports;

// Grmr.prototype._rule_rule1 = function() {
//   return this.enter('rule1', 0) && this.match('str') &&
//          this.set('a') && this.body(this.get('a')) && this.leave() ||
//          this.enter('rule1', 1) && this.open() && this._rule_%rule_name%() &&
//          this.close() && this.leave();
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
    args: {},
    result: undefined,
    intermediate: undefined
  };

  // enter initial state
  this.enter('');
};
core.AbstractParser = AbstractParser;

//
// ### function enter (rule)
// #### @rule {String} rule name
// #### @id {Number} match id (both rule and id may be used for caching)
// enters current position to stack
//
AbstractParser.prototype.enter = function enter(rule, id) {
  this.state = {
    source: this.state.source,
    offset: this.state.offset,
    log: [],
    args: {},
    result: undefined,
    intermediate: undefined
  };
  this.history.push(this.state);

  return true;
};

//
// ### function leave (fail)
// #### @fail {Boolean} are we restoring from failed match
// leaves to previous position
//
AbstractParser.prototype.leave = function leave(fail) {
  this.state = this.history.pop();

  return !fail;
};

//
// ### function skip ()
// Skips one item in list
//
AbstractParser.prototype.skip = function skip() {
  var state = this.state;

  // Out of bounds check
  if (state.source.length < ++state.offset) {
    state.source = undefined;
  }

  return true;
};

//
// ### function open (type)
// #### @type {String} either `list` or `lookahead`
// opens array at current position
//
AbstractParser.prototype.open = function open(type) {
  var state = this.state,
      next;

  if (type === 'list') {
    var next = state.source[state.offset];

    // Value should be sequencable
    if (!Array.isArray(next) && typeof next !== 'string') {
      return this.leave(true);
    }
  }

  state.log.push({ source: state.source, offset: state.offset, type: type });

  // List should go deeper
  if (type === 'list') {
    state.source = next;
  }
  state.offset = 0;

  return true;
};

//
// ### function close ()
// Returns back from array matching
//
AbstractParser.prototype.close = function close() {
  var state = this.state,
      entry = state.log.pop();

  // If we're closing list - ensure that we reached it's end
  if (entry.type === 'list' && state.source.length !== state.offset) {
    return this.leave(true);
  }

  state.source = entry.source;
  state.offset = entry.offset;

  // Handle [ ... ]:argname
  state.intermediate = state.source[state.offset];

  // Look-ahead should not change offset
  if (entry.type === 'list') {
    // Go to next item
    this.skip();
  }

  return true;
};

//
// ### function match (str)
// #### @str {String} chunk of string to match
//
AbstractParser.prototype.match = function match(str) {
  var state = this.state,
      curr = state.source[state.offset];

  if (curr === str) {
    // Move to next item
    this.skip();
    state.intermediate = curr;
    return true;
  } else {
    return this.leave(true);
  }
};

//
// ### function set (name)
// #### @name {String} argument name
// Sets argument's value to current intermediate value
//
AbstractParser.prototype.set = function set(name) {
  var state = this.state;
  state.args[name] = state.intermediate;

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
// ### function body (code)
// #### @code {Function} host language code
// Calls host language code and sets result into `intermediate` value
//
AbstractParser.prototype.body = function body(code) {
  this.state.intermediate = code.call(this);
  return true;
};

//
// ### function result (code)
// #### @result {Function} host language code
// Calls host language code and sets result into `result` value
//
AbstractParser.prototype.result = function body(code) {
  this.state.result = code.call(this);
  return true;
};
