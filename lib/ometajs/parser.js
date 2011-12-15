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
  this.stagingTokens = [];
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
    if (this.state === 'empty') {
      this.parseGrammar();
    } else if (this.state === 'rule') {
      this.parseRule();
    } else if (this.state === 'left-predicates') {
      // Parse left predicates
      while (this.active && !this.optional('punc', '=')) {
        this.parsePredicate('left');
      }
      // Commit '='
      this.commit();
      this.state = 'right-predicates';
    } else if (this.state === 'right-predicates') {
      // Parse right predicates
      while (this.active && !this.optional('punc', '->')) {
        this.parsePredicate('right');
      }
      // Commit '->'
      this.commit();

      // Finalize predicates
      this.pop();

      // Enter body
      this.push([]);
      this.state = 'body';
    } else if (this.state === 'body') {
    }
  }

  return this.ast;
};

//
// ### function parseGrammar ()
// Parser's routine
//
Parser.prototype.parseGrammar = function parseGrammar() {
  // ometa %GrammarName%
  if (!this.token('keyword', 'ometa')) return;
  this.state = 'grammar';
  this.push(['grammar', this.token('name').value]);

  // Nested grammars, <: %GrammarName%
  this.push(
    this.optional('punc', '<:') ?
        this.commit() && this.token('name').value
        :
        null
  );
  this.pop();

  // Prepare for rules
  this.token('punc', '{');
  this.push([]);
  this.state = 'rule';
};

//
// ### function parseRule ()
// Parser's routine
//
Parser.prototype.parseRule = function parseRule() {
  // Handle grammar end
  if (this.optional('punc', '}')) {
    // Remove token from history
    this.commit();

    // Leave rules and grammar
    this.pop();
    this.pop();

    // Wait for next grammar
    this.state = 'empty';
    return;
  }

  var name;

  // Rule name
  if ((name = this.optional('name')) && this.optional('punc', '=')) {
    this.push([name]);
    this.state = 'left-predicates';
    this.commit();
  } else {
    this.push([null]);
    this.state = 'right-predicates';
  }

  // Allocate space for predicates
  this.push([]);
};

//
// ### function parsePredicate (type)
// #### @type {String} left or right
// Parser's routine
//
Parser.prototype.parsePredicate = function parsePredicate(type) {

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

  // Push token to staging if we was matching optionally
  if (optional) this.stagingTokens.push(token);

  // Check if token matches our conditions
  if (tokenMatch(token, type, value)) {
    return token;
  } else {
    if (optional) {
      this.fail();
      return false;
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
// ### function commit ()
// Removes all tokens from staging history
// Call it after .optional() if you matched
//
Parser.prototype.commit = function commit() {
  this.stagingTokens = [];
  return true;
};

//
// ### function fail ()
// Adds tokens from stage to actual history
// Call it after .optional() if you haven't matched
//
Parser.prototype.fail = function fail() {
  this.tokens = this.tokens.concat(this.stagingTokens);
  this.stagingTokens = [];
  return true;
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
