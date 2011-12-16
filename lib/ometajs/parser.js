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
    this.parseGrammar();
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

  this.parseUntil('punc', '}', function parseRules() {
    this.parseRule();
  });
  this.commit();

  this.pop();
  this.pop();

  this.state = 'empty';
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
    return;
  }

  var name;

  // Rule name
  if (name = this.optional('name')) {
    this.push(['rule', name.value]);
    this.commit();
  } else {
    this.push(['rule', null]);
  }

  // Parse rule's expressions
  var end = this.parseUntil('punc', ['}', ','], function parseExpressions() {
    var end;

    // Parse left expression
    end = this.parseUntil('punc', ['=', ',', '}'], function parseLeft() {
      this.parseExpression('left');
      this.pop();
    });

    // Parse right expression
    if (matchToken(end, 'punc', '=')) {
      this.commit();
      end = this.parseUntil('punc', [',', '}'], function parseRight() {
        this.parseExpression('right');
        this.pop();
      });
    }

    this.fail();
  });

  if (end.value === ',') {
    // Continue parsing next rule
    this.commit();
  } else {
    // Let others parse '}'
    this.fail();
  }

  this.pop();
};

//
// ### function parseExpression (type)
// #### @type {String} left, right, interleave, parens
// Parser's routine
//
Parser.prototype.parseExpression = function parseExpression(type) {
  if (type === 'left') {
    // :name
    if (this.optional('punc', ':')) {
      this.commit();
      this.push(['arg', this.token('name').value]);
    } else {
      this.fail();
    }
  } else if (type === 'right') {
    // Parse multiple choices for a rule's right side
    this.branch('choice', 'punc', '|', function parseChoices() {
      this.parseExpression('interleave');
    });
  } else if (type === 'interleave') {
    // Parse multiple interleaves
    // a && b && c
    this.branch('choice', 'punc', '&&', function parseInterleaves() {
      this.parseExpression('parens');
    });
  } else if (type === 'parens') {
    // Parse interleave in parens or with modificator
    // (a) or a or a* or a+ or a?
    if (this.optional('punc', '(')) {
      this.commit();
      this.parseExpression('left');
      this.token('punc', ')');
      this.wrap(['mod', 'none']);
    } else {
      this.fail();
      this.parseExpression('left');
      var mod;
      if (this.current.length == 2) {
        mod = this.current[1][0];
        if (mod !== '*' && mod !== '+' && mod !== '?') mod = 'none';
      } else {
        mod = 'none';
      }
      this.wrap(['mod', mod]);
    }
  }
};

//
// ### function branch (op, type, value, parse)
// #### @op {String}
// #### @type {String}
// #### @value {String|Array}
// #### @parse {Function}
// Parser's helper
//
Parser.prototype.branch = function branch(op, type, value, parse) {
  var token;
  do {
    if (token) {
      // Wrap previous expression into a branch
      this.wrap([op, token.value]);
      // Commit token
      this.commit();
    }
    parse.call(this);
  } while (this.active && (token = this.optional(type, value)));
  this.fail();
};

//
// ### function parseUntil (type, value, parse)
// #### @type {String}
// #### @value {String|Array}
// #### @parse {Function}
// Parser's helper
//
Parser.prototype.parseUntil = function parseUntil(type, value, parse) {
  var end;
  while (this.active && !(end = this.optional(type, value))) {
    parse.call(this);
  }

  return end;
};

//
// ### function matchToken (token, type, value)
// #### @type {String} (optional) required token type
// #### @value {String|Array} (optional) required token value or values
// Checks if token match type and value
//
function matchToken(token, type, value) {
  return (type === undefined || token.type === type) &&
         (value === undefined || (
           Array.isArray(value) ?
               value.indexOf(token.value) !== -1
               :
               token.value === value
         ));
}

//
// ### function token (type, value)
// #### @type {String} (optional) required token type
// #### @value {String|Array} (optional) required token value, or values
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
  if (matchToken(token, type, value)) {
    return token;
  } else {
    if (optional) {
      this.fail();
      return false;
    } else {
      this.unexpected(token, type, value);
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
// ### function unexpected (token, type, value)
// #### @token {Object} Source token
// #### @type {String} Expected type
// #### @value {String} Expected value
// Throws pretty error
//
Parser.prototype.unexpected = function unexpected(token, type, value) {
  throw new Error('Expected [type: ' + type + ' value: ' + value + '] ' +
                  'token, but found [type: ' + token.type + ' value: ' +
                  token.value + ']');
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
// ### function wrap (node)
// #### @node {Array} AST Node
// Wraps curent node into passed one
//
Parser.prototype.wrap = function wrap(node) {
  var wrapped = node.concat([this.current]);
  this.stack[this.stack.length - 1] = wrapped;
  return this.current = wrapped;
}

//
// ### function pop ()
// Pops node from stack
//
Parser.prototype.pop = function pop() {
  var result = this.stack.pop();

  this.current = this.stack[this.stack.length - 1];

  return result;
};
