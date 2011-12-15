var parser = exports;

var ometajs = require('../ometajs');

//
// ### function Parser (code)
// #### @code {String} input source code
// Parser's constructor
//
function Parser(code) {
  this.code = code;
  this.lexer = ometajs.lexer.create(code);
  this.state = 'empty';
  this.active = true;

  // State information needed for AST creation
  this.ast = ['topLevel', []];
  this.current = this.ast[1];
  this.stack = [this.ast[1]];

  // Tokens history for look-ahead
  this.tokens = [];
}

//
// ### function create (code)
// #### @code {String} input source code
// Returns Parser's instance
//
parser.create = function create(code) {
  return new Parser(code);
};

//
// ### function execute ()
// Returns AST of source code
//
Parser.prototype.execute = function execute() {
  while (this.active) {
    switch (this.state) {
      case 'empty':
        // ometa %GrammarName%
        if (!this.token('keyword', 'ometa')) break;
        this.state = 'grammar';
        this.push(['grammar', this.token('name').value]);

        // Nested grammars, <: %GrammarName%
        this.push(
          this.optional('punc', '<:') ?
              this.token('name').value
              :
              null
        );
        this.pop();

        // Prepare for rules
        this.token('punc', '{');
        this.push([]);
        this.state = 'rule';
        break;
      case 'rule':
        // Handle grammar end
        if (this.optional('punc', '}')) {
          // Leave rules
          this.pop();

          // Leave grammar
          this.pop();

          // Wait for next grammar
          this.state = 'empty';
          break;
        }
    }
  }

  return this.ast;
};

//
// ### function tokenMatch (token, type, value)
// #### @type {String} (optional) required token type
// #### @value {String} (optional) required token value
// Checks if token match type and value
//
function tokenMatch(token, type, value) {
  return (type === undefined || token.type === type) &&
         (value === undefined || token.value === value);
}

//
// ### function token (type, value)
// #### @type {String} (optional) required token type
// #### @value {String} (optional) required token value
// #### @optional {Boolean} (optional) is that token optional?
// Demand token (may throw error)
//
Parser.prototype.token = function token(type, value, optional) {
  var token = this.tokens.length ? this.tokens.shift() : this.lexer.token();

  // End of file
  if (!token) {
    if (this.state === 'empty') {
      this.active = false;
      return token;
    } else {
      throw new Error('Unexpected end of file');
    }
  }

  if (tokenMatch(token, type, value)) {
    return token;
  } else {
    if (optional) {
      this.tokens.push(token);
    } else {
      throw new Error('Expected [type: ' + type + ' value: ' + value + '] ' +
                      'token, but found [type: ' + token.type + ' value: ' +
                      token.value + ']');
    }
  }
};

//
// ### function optional (type, value)
// #### @type {String} (optional) required token type
// #### @value {String} (optional) required token value
// Look ahead, wrapper for .token()
//
Parser.prototype.optional = function optional(type, value) {
  return this.token(type, value, true);
};

//
// ### function push (node)
// #### @node {Array} AST Node
// Pushes node into AST tree and stack
//
Parser.prototype.push = function push(node) {
  this.current.push(node);
  this.stack.push(node);
  this.current = node;
};

//
// ### function pop ()
// Pops node from stack
//
Parser.prototype.pop = function pop() {
  var result = this.stack.pop();

  this.current = this.stack[this.stack.length - 1];

  return result;
};
