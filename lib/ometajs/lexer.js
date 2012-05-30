var lexer = exports;

//
// ### function Lexer (code)
// #### @code {String} source code
// Lexer constructor
//
function Lexer(code) {
  this.code = code.trim();
  this.offset = 0;
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

  return this.match('name', 1, /^([$_\w][$_\w\d]*)(?:[\s\{]|$)/) ||
         this.match('punc', 1 ,/^([\[\]{}~!+^=|:*?]|->)/) ||
         this.match('number', 0, /^-?\d+(?:\.\d+)?/) ||
         this.match('string', 1, /^[#`]([^\s]+)/) ||
         this.match('string', 0, /^"(?:[^"]|\\")*"/, JSON.parse) ||
         this.match('token', 0, /^'(?:[^']|\\')*'/, function(val) {
           return JSON.parse('"' + val + '"').slice(1, -1);
         }) ||
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
// ### function skip (chars)
// #### @char {Number} number chars to skip
// Skips number of chars
//
Lexer.prototype.skip = function skip(chars) {
  var code = this.code;

  this.code = this.code.slice(chars).trim();
  this.offset += code.length - this.code.length;
};

//
// ### function unexpected ()
// Returns false if reached end of code or throws exception
//
Lexer.prototype.unexpected = function unexpected() {
  if (this.code.length === 0) return false;
  throw new Error('Lexer failer at: ' + this.code);
};
