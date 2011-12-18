var lexer = exports;

//
// ### function Lexer (code)
// #### @code {String} source code
// Lexer constructor
//
function Lexer(code) {
  this.code = code.trim();
  this.offset = 0;
  this.noTrim = false;
};

//
// ### function create (code)
// #### @code {String} source code
// Lexer's constructor wrapper
//
lexer.create = function create(code) {
  return new Lexer(code);
};

//
// ### function token ()
// Returns token or false (may throw)
//
Lexer.prototype.token = function token() {
  var result;

  return this.match('comment', 0, /^(\/\/.*)[\r\n]/, function(val) {
           return val.slice(2, -1);
         }) || this.match('space', 0, /^[\s\r\n]+/) ||
         this.match('name', 0, /^[$_\w][$_\w\d]*/) ||
         this.match('punc', 1, /^(->|<:|&&|\|\||[()\[\]{}<>,.~!+^=|:;*?&])/) ||
         this.match('number', 0, /^-?\d+(?:\.\d+)?/) ||
         this.match('string', 1, /^([#`][$_\w\d-]+)/, function(val) {
           return val.slice(1);
         }) ||
         this.match('string', 0, /^'(?:[^'\\]|\\.)*'/, function(val) {
           function swap(quote) {
             return quote === '"' ? '\'' : '"';
           }
           val = val.replace(/["']/g, swap);
           return JSON.parse(val).replace(/["']/g, swap);
         }) ||
         this.match('token', 0, /^"(?:[^"\\]|\\.)*"/, JSON.parse) ||
         this.unexpected();
};

//
// ### function match (type, index, re, sanitizer)
// #### @type {String} Token type
// #### @index {Number} Number of match in regexp to pick as value
// #### @re {RegExp} regexp itself
// #### @sanitizer {Function} (optional) preprocess value
// Tries to match current code against regexp and returns token on success
//
Lexer.prototype.match = function match(type, index, re, sanitizer) {
  var match = this.code.match(re);
  if (!match) return false;

  var offset = this.offset,
      value = match[index];

  this.skip(match[index].length);

  if (type === 'name' && value === 'ometa') type = 'keyword';
  if (sanitizer !== undefined) value = sanitizer(value);

  return { type: type, value: value, offset: offset };
};

//
// ### function trim ()
// Removes spaces at start and end of source code
//
Lexer.prototype.trim = function trim() {
  var code = this.code;
  this.code = this.code.trim();
  this.offset += code.length - this.code.length;
};

//
// ### function skip (chars)
// #### @char {Number} number chars to skip
// Skips number of chars
//
Lexer.prototype.skip = function skip(chars) {
  var code = this.code;

  this.code = this.code.slice(chars);

  this.offset += code.length - this.code.length;
};

//
// ### function unexpected ()
// Returns false if reached end of code or throws exception
//
Lexer.prototype.unexpected = function unexpected() {
  if (this.code.length === 0) return false;
  throw new Error('Lexer failer at: "' + this.code.slice(0, 11) + '"');
};
