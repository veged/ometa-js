var ometajs = require('../../ometajs'),
    util = require('util');

//
// ### function AbstractGrammar (source)
// #### @source {Array|String} source code
// Abstract Grammar constructor
//
function AbstractGrammar(source) {
  ometajs.core.AbstractParser.call(this, source);
  this._name = 'AbstractGrammar';
}
util.inherits(AbstractGrammar, ometajs.core.AbstractParser);
module.exports = AbstractGrammar;

//
// ### function match (source, rule, args)
// #### @source {Array|String} source code
// #### @rule {String} rule to start parsing with
// #### @args {Array} (optional) arguments
// Creates instance of the grammar, invokes rule and returns a result
//
AbstractGrammar.match = function match(source, rule, args) {
  return this.matchAll([source], rule, args);
};

//
// ### function matchAll (source, rule, args)
// #### @source {Array|String} source code
// #### @rule {String} rule to start parsing with
// #### @args {Array} (optional) arguments
// Creates instance of the grammar, invokes rule and returns a result
//
AbstractGrammar.matchAll = function matchAll(source, rule, args) {
  var grmr = new this(source);

  if (!grmr._rule(rule, false, args)) {
    if (grmr._error.offset >= 0) {
      var line,
          lineNumber = 0,
          offset,
          current = 0;

      source.split(/\n/g).some(function (source, i) {
        if (grmr._error.offset > (current + source.length + 1)) {
          current += source.length + 1;
          return false;
        }

        offset = grmr._error.offset - current;
        line = source;
        lineNumber = i;

        return true;
      });

      if (!grmr._error.stack) grmr._error.stack = new Error();

      grmr._error.stack.message = grmr._error.rule + ' rule failed at: ' +
                                  lineNumber + ':' + offset + '\n' +
                                  line + '\n' +
                                  new Array(offset + 1).join(' ') + '^';
      throw grmr._error.stack;
    } else {
    }
  }

  return grmr._getIntermediate();
};

AbstractGrammar.prototype._invoke = function _invoke(grmr, rule, nc, args) {
  function invoke() {
    // Nullify result
    this._result = undefined;

    // Invoke actual rule function
    var fn = grmr.prototype[rule];
    if (fn === undefined) return false;
    return fn.call(this);
  }

  if (args && args.length > 0) {
    return this._simulate(args, invoke);
  } else if (!nc) {
    return this._cache(grmr.name, rule, invoke);
  } else {
    return invoke.call(this);
  }
};

//
// ### function rule (name, args)
// #### @name {String} rule name
// #### @args {Array} (optional) arguments
//
//
AbstractGrammar.prototype._rule = function rule(name, nocache, args, cons) {
  this._lastError(name);

  // `apply` is a meta rule that invokes rule provided in arguments
  if (name === 'apply') return this._rule(args[0], nocache, args.slice(1));

  // Token rule is quite magical :)
  // It'll remember a token at the current position
  // and then use _tokenCache for matching
  // that change will automatically add lexer for any grammar
  if (name === 'token') {
    var flat = this._history.length === 0 && this._type === 'string',
        offset = this._offset;

    // This cache will work only on flat string source
    if (flat) {
      // If we hit cache - just do a simple comparison
      var cache = this._tokenCache[offset];
      if (cache !== undefined) {
        if (cache.token === args[0]) {
          this._skip(cache.skip);
          this._setIntermediate(cache.value, true);
          return true;
        } else {
          return false;
        }
      }
    }

    return this._atomic(function() {
      // If not - invoke grammar code first
      if (!this._invoke(cons || this.constructor, name, nocache)) {
        return false;
      }

      // Get result
      var pair = this._getIntermediate();

      // And store it cache
      if (flat) {
        this._tokenCache[offset] = {
          token: pair[0],
          value: pair[1],
          skip: this._offset - offset
        };
      }

      // Anyway perform check
      if (pair[0] === args[0]) {
        this._setIntermediate(pair[1], true);
        return true;
      } else {
        return false;
      }
    });
  }
  return this._invoke(cons || this.constructor, name, nocache, args);
};

//
// ### function fromTo (from, to)
// #### @from {any}
// #### @to {any}
// Tries to match content between `from` and `to`
//
AbstractGrammar.prototype._fromTo = function fromTo(from, to) {
  var head = this._source.slice(this._offset, this._offset + from.length);
  if (head !== from) return false;

  var t = this._source.indexOf(to, this._offset);

  if (t === -1) return false;

  t += to.length;

  var value = this._source.slice(this._offset, t);

  this._skip(value.length);
  this._setIntermediate(value);

  return true;
};

//
// ### function seq (str)
// #### @str {String}
// Tries to match chars sequence
//
AbstractGrammar.prototype._seq = function seq(str) {
  if (this._type === 'string') {
    var len = str.length;

    if (len < 4) {
      for (var i = 0; i < len; i++) {
        if (!this._match(str[i])) return false;
      }
    } else {
      var head = this._source.slice(this._offset, this._offset + len);
      if (head !== str) return false;
    }

    this._skip(len);
  } else {
    for (var i = 0; i < str.length; i++) {
      if (!this._match(str[i])) return false;
    }
  }

  return true;
};

//
// ### function word ()
// Tries to match non-space chars sequence
//
AbstractGrammar.prototype._word = function word() {
  if (this._type === 'string') {
    var match = this._source.slice(this._offset).match(/^[^\s]+/);
    if (match === null) return false;
    this._skip(match[0].length);
    this._setIntermediate(match[0]);

    return true;
  } else {
    var chars = [],
        current;

    while (!this._isEnd() && !(/\s/.test(current = this._current()))) {
      this._skip();
      chars.push(current);
    }

    if (!this._isEnd()) return false;

    this._setIntermediate(chars.join(''));

    return true;
  }
};

//
// ### function any (fn)
// #### @fn {Function} function to iterate with
// Greedy matcher, count >= 0
//
AbstractGrammar.prototype._any = function any(fn) {
  var list = [];

  while (!this._isEnd() && fn.call(this)) {
    list.push(this._getIntermediate());
  }

  this._setIntermediate(list);

  return true;
};

//
// ### function many (fn)
// #### @fn {Function} function to iterate with
// Greedy matcher, count > 0
//
AbstractGrammar.prototype._many = function many(fn) {
  var list = [];

  if (!fn.call(this)) return false;
  list.push(this._getIntermediate());

  while (!this._isEnd() && fn.call(this)) {
    list.push(this._getIntermediate());
  }

  this._setIntermediate(list);

  return true;
};

//
// ### function optional (fn)
// #### @fn {Function} function to iterate with
// Match, or at least not fail
//
AbstractGrammar.prototype._optional = function optional(fn) {
  if (!fn.call(this)) {
    this._setIntermediate(undefined);
  }

  return true;
};

//
// ### function token ()
// Default token rule implementation
//
AbstractGrammar.prototype.token = function token() {
  if (!this._word()) return false;
  var token = this._getIntermediate();

  // Match whitespace after token and close 'chars'
  if (this._rule('spaces')) {
    this._setIntermediate([token, token], true);
    return true;
  } else {
    this._setIntermediate(undefined);
    return false;
  }
};

//
// ### function anything ()
// Default `anything` rule implementation
//
AbstractGrammar.prototype.anything = function anything() {
  return this._skip();
};

//
// ### function space ()
// Default `space` rule implementation
//
AbstractGrammar.prototype.space = function space() {
  return this._fnMatch(function(v) { return /^[\s\n\r]$/.test(v) });
};

//
// ### function spaces ()
// Default `spaces` rule implementation
//
AbstractGrammar.prototype.spaces = function spaces() {
  return this._any(function() {
    return this._rule('space');
  });
};

//
// ### function fromTo ()
// Default `fromTo` rule implementation
//
AbstractGrammar.prototype.fromTo = function fromTo() {
  this._skip();
  var from = this._getIntermediate();
  this._skip();
  var to = this._getIntermediate();

  return this._fromTo(from, to);
};

//
// ### function char ()
// Default `char` rule implementation
//
AbstractGrammar.prototype.char = function char() {
  return this._fnMatch(function(curr) {
    return typeof curr === 'string' &&
           curr.length === 1;
  });
};

//
// ### function letter ()
// Default `letter` rule implementation
//
AbstractGrammar.prototype.letter = function letter() {
  return this._fnMatch(function(curr) {
    return /^[a-zA-Z]$/.test(curr);
  });
};

//
// ### function letter ()
// Default `digit` rule implementation
//
AbstractGrammar.prototype.digit = function digit() {
  return this._fnMatch(function(curr) {
    return /^\d$/.test(curr);
  });
};

//
// ### function seq ()
// Default `seq` rule implementation
//
AbstractGrammar.prototype.seq = function seq() {
  this._skip();
  var seq = this._getIntermediate();

  return this._seq(seq);
};

//
// ### function listOf ()
// Default `listOf` rule implementation
//
AbstractGrammar.prototype.listOf = function listOf() {
  this._skip();
  var rule = this._getIntermediate();

  this._skip();
  var sep = this._getIntermediate();

  if (!this._rule(rule)) {
    this._setIntermediate([], true);
    return true;
  }
  var list = [this._getIntermediate()];

  while (this._seq(sep)) {
    if (!this._rule(rule)) return false;
    list.push(this._getIntermediate());
  }

  this._setIntermediate(list, true);

  return true;
};

//
// ### function empty ()
// Default `empty` rule implementation
//
AbstractGrammar.prototype.empty = function empty() {
  return true;
};

//
// ### function end ()
// Default `end` rule implementation
//
AbstractGrammar.prototype.end = function end() {
  return this._isEnd();
};
