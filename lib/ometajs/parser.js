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
    var code = [];
    while (this.active && !this.optional('keyword', 'ometa', true)) {
      code.push(this.token(null, null, true).value);
    };
    this.fail();

    if (code.length > 0) {
      code = code.join('').trim();
      if (code) {
        this.push(['code', code]);
        this.pop();
      }
    }

    if (this.active) this.parseGrammar();
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
    this.optional('punc', '<:') && this.commit() ?
        this.token('name').value
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
  if (this.optional('punc', '}') && this.commmit()) {
    // Leave rules and grammar
    this.pop();
    this.pop();

    // Wait for next grammar
    return;
  }

  var name;

  // Rule name
  if (name = this.optional('name')) {
    this.commit();
    this.push(['rule', name.value]);
  } else {
    this.push(['rule', null]);
  }
  this.push([]);

  // Parse rule's expressions
  var end = this.parseUntil('punc', ['}', ',', '->'], function parseExprs() {
    var end;

    // Parse left expression
    end = this.parseUntil('punc', ['=', ',', '}', '->'], function parseLeft() {
      this.parseExpression();
    });

    // Parse right expression
    if (matchToken(end, 'punc', '=')) {
      this.commit();
      end = this.parseUntil('punc', [',', '}', '->'], function parseRight() {
        this.parseExpression();
      });
    }

    this.fail();
  });

  this.pop();

  // -> { host language body }
  if (matchToken(end, 'punc', '->')) {
    this.push(['body']);
    this.parseHostExpression();
    this.pop();

    end = this.optional('punc', [',', '}']);
  }

  if (matchToken(end, 'punc', ',')) {
    // Continue parsing next rule
    this.commit();
  } else {
    // Let others parse '}'
    this.fail();
  }

  this.pop();
};

//
// ### function parseExpression ()
// Parser's routine
//
Parser.prototype.parseExpression = function parseExpression() {
  var token = this.token(null, null, true),
      space = this.optional('space') && this.commit(),
      matched = false;

  if (matchToken(token, 'punc', '(')) {
    // ( expr | ... | expr )
    this.push(['choice']);
    this.list('punc', '|', function() {
      this.parseExpression(space);
    });
    this.token('punc', ')');
    space = null;
  } else if (matchToken(token, 'punc', '[')) {
    this.push(['list']);
    // [ expr expr expr ]
    this.parseUntil('punc', ']', true, function() {
      if (this.optional('space')) this.commit();
      this.parseExpression(true);
    });
    space = null;
  } else if (matchToken(token, 'punc', '^')) {
    this.push(['super']);
    this.parseRuleInvocation(this.token('name'));
    this.pop();
  } else if (matchToken(token, 'name')) {
    this.parseRuleInvocation(token);
  } else if (matchToken(token, 'string')) {
    this.push(['string', token.value]);
  } else if (matchToken(token, 'token')) {
    this.push(['token', token.value]);
  } else if (matchToken(token, 'punc', '{')) {
    this.push(['code']);
    this.parseHostExpression();
    this.token('punc', '}');
  } else {
    this.push(null);
  }

  if (space === null) space = this.optional('space') && this.commit();

  if (matchToken(token, 'punc', ':') ||
      !space && this.optional('punc', ':') && this.commit()) {
    this.wrap(['arg']);
    this.push(this.token('name').value);
    this.pop();
  }
  this.pop();
};

//
// ### function parseRuleInvocation (token)
// #### @token {Object} A Lexer's 'name' token
// Parser's routine
//
Parser.prototype.parseRuleInvocation = function parseRuleInvocation(token) {
  var name;
  // grmr.rule
  if (this.optional('punc', '.')) {
    this.commit();
    name = [token.value, this.token('name').value];
    space = null;
  } else {
    // rule
    name = [null, token.value];
  }

  // Maybe rule(...) ?
  if (this.optional('punc', '(')) {
    this.commit();

    this.push(['call', name]);
    this.push([]);
    this.parseUntil('punc', ')', function() {
      this.parseHostExpression();
      if (this.optional('punc', ',')) this.commit();
    });
    this.pop();
    space = null;
  } else {
    this.push(['match', name]);
  }
};

//
// ### function parseHostExpression (depth)
// #### @depth {Number} (optional) initial paren depth
// Parser's routine
//
Parser.prototype.parseHostExpression = function parseHostExpression(depth) {
  var token,
      dived = false,
      code = [];

  if (!depth) depth = 0;

  for (;;) {
    token = this.optional(null, null, true)

    if (matchToken(token, 'punc', ['{', '(', '['])) {
      depth++;
      dived = true;
    } else if (matchToken(token, 'punc', ['}', ')', ']'])) {
      depth--;
      dived = true;
    }

    if (dived && depth < 0 || depth <= 0 && matchToken(token, 'punc', ',')) {
      this.fail();
      break;
    }

    this.commit();

    code.push(
      (token.type === 'string' || token.type === 'token') ?
        JSON.stringify(token.value)
        :
        token.value
    );
  }

  this.push(code.join(''));
  this.pop();
};

//
// ### function list (type, value, parse)
// #### @type {String}
// #### @value {String|Array}
// #### @parse {Function}
// Parser's helper
//
Parser.prototype.list = function list(type, value, parse) {
  var token;
  do {
    if (token) this.commit();
    parse.call(this);
  } while (this.active && (token = this.optional(type, value)));
  this.fail();
};

//
// ### function parseUntil (type, value, parse)
// #### @type {String}
// #### @value {String|Array}
// #### @space {Boolean} (optional)
// #### @parse {Function}
// Parser's helper
//
Parser.prototype.parseUntil = function parseUntil(type, value, space, parse) {
  var end;

  // Space is optional argument
  if (parse === undefined) {
    parse = space;
    space = false;
  }

  while (this.active && !(end = this.optional(type, value, space))) {
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
  return (!type || token.type === type) &&
         (!value || (
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
// #### @space {Boolean} (optional) do not parse spaces automatically
// #### @optional {Boolean} (optional) is that token optional?
// Demand token (may throw error)
//
Parser.prototype.token = function token(type, value, space, optional) {
  var token = this.tokens.length ? this.tokens.shift() : this.lexer.token();

  // End of file
  if (!token) {
    if (this.state === 'empty' || optional && type === 'space') {
      this.active = false;
      return token;
    } else {
      throw new Error('Unexpected end of file, ' + type + ' expected');
    }
  }

  // Push token to staging if we was matching optionally
  if (optional) this.stagingTokens.push(token);

  // Check if token matches our conditions
  if (matchToken(token, type, value)) {
    // Skip space automatically
    if (!space && type !== 'space') {
      if (this.tokens.length) {
        if (this.tokens[0].type === 'space') this.tokens.shift();
      } else {
        this.lexer.trim();
      }
    }

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
// #### @space {Boolean} (optional) do not parse spaces automatically
// Look ahead, wrapper for .token()
//
Parser.prototype.optional = function optional(type, value, space) {
  return this.token(type, value, space, true);
};

//
// ### function commit ()
// Removes all tokens from staging history
// Call it after .optional() if you matched
//
Parser.prototype.commit = function commit() {
  this.stagingTokens.pop();
  return true;
};

//
// ### function fail ()
// Adds tokens from stage to actual history
// Call it after .optional() if you haven't matched
//
Parser.prototype.fail = function fail() {
  if (this.stagingTokens.length > 0) {
    this.tokens.push(this.stagingTokens.pop());
  }
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
  this.pop();
  var current = node.concat([this.current.pop()]);
  this.push(current);
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
