var core = exports;

// Grmr.prototype._rule_rule1 = function() {
//   return this.save() && this.match('str') && this.arg('a') && this.restore() ||
//          this.save() && this.enter() && this._rule_%rule_name%() && this.leave() && this.restore();
// }

//
// ### function AbstractParser (source)
// #### @source {Array|String} source code
// Abstract Parser constructor
//
function AbstractParser(source) {
  this.original = source;
  this.source = source;
  this.intermeditate = undefined;
  this.history = [];
  this.log = [ { source: source, offset: this.offset } ];
  this.args = {};
  this.offset = 0;
  this.cache = {};

  // Save initial state
  this.save();
};
core.AbstractParser = AbstractParser;

//
// ### function save ()
// Saves current position to stack
//
AbstractParser.prototype.save = function save(rule) {
  var key = this.log.map(function(entry) {
        return entry.offset;
      }).join('-') + ':' + this.offset + ':' + rule;

  this.history.push({
    offset: this.offset,
    log: this.log.length,
    args: this.args,
    cache: key
  });
  this.args = {};

  // If we already know that this rule won't match at current position
  if (this.cache[key]) {
    // Fail early
    return this.restore(true);
  } else {
    return true;
  }
};

//
// ### function restore (fail)
// #### @fail {Boolean} are we restoring from failed match
// Restores to previous position
//
AbstractParser.prototype.restore = function restore(fail) {
  var entry = this.history.pop();
  this.offset = entry.offset || 0;
  this.log = this.log.slice(0, entry.log);
  this.source = this.original.slice(this.offset);
  this.args = entry.args;

  if (fail) {
    this.cache[entry.cache] = true;
    return false;
  } else {
    return true;
  }
};

//
// ### function skip ()
// Skips one item in list
//
AbstractParser.prototype.skip = function skip() {
  this.source = this.source.slice(++this.offset);
  if (this.source.length === 0) this.source = undefined;

  return true;
};

//
// ### function enter ()
// Enters array at current position
//
AbstractParser.prototype.enter = function enter() {
  this.log.push({ source: this.source, offset: this.offset });
  this.source = this.source[0];
  this.offset = 0;

  return true;
};

//
// ### function leave ()
// Returns back from array matching
//
AbstractParser.prototype.leave = function leave() {
  var entry = this.log.pop();
  this.source = entry.source;
  this.offset = entry.offset;

  return true;
};

//
// ### function match (str)
// #### @str {String} chunk of string to match
//
AbstractParser.prototype.match = function match(str) {
  var curr = this.source[0];
  if (curr === str) {
    // Move to next item
    this.skip();
    this.intermediate = curr;
    return true;
  } else {
    return this.restore(true);
  }
};
