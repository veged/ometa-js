var core = exports;

// Grmr.prototype._rule_rule1 = function() {
//   return this.enter('rule1-0') && this.match('str') &&
//          this.set('a') && this.body(this.get('a')) && this.leave() ||
//          this.enter('rule1-1') && this.open() && this._rule_%rule_name%() &&
//          this.close() && this.leave();
// }

//
// ### function AbstractParser (source)
// #### @source {Array|String} source code
// Abstract Parser constructor
//
function AbstractParser(source) {
  this.source = source;
  this.intermeditate = undefined;
  this.history = [];
  this.state = { source: source, offset: 0, args: {} };

  // enter initial state
  this.enter('');
};
core.AbstractParser = AbstractParser;

//
// ### function enter (rule)
// ####
// enters current position to stack
//
AbstractParser.prototype.enter = function enter(rule) {
  this.state = {
    source: this.state.source,
    offset: this.state.offset,
    log: [],
    args: {}
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
  if (state.source.length <= ++state.offset) {
    state.source = undefined;
  }

  return true;
};

//
// ### function open ()
// opens array at current position
//
AbstractParser.prototype.open = function open() {
  var state = this.state;

  state.log.push({ source: state.source, offset: state.offset });
  state.source = state.source[state.offset];
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

  state.source = entry.source;
  state.offset = entry.offset;

  // Handle [ ... ]:argname
  this.intermediate = state.source[state.offset];

  // Go to next item
  this.skip();

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
    this.intermediate = curr;
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
  this.state.args[name] = this.intermediate;

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
