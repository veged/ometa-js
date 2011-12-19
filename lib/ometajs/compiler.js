var compiler = exports;

//
// ### function Compiler (options, ast)
// #### @options {Object} compiler options
// #### @ast {Array} source code AST
// Compiler constructor
//
function Compiler(options, ast) {
  this.options = options;
  this.ast = ast;
  this.buffer = [];
};

//
// ### function create (options, ast)
// #### @options {Object} compiler options
// #### @ast {Array} source code AST
// Compiler constructor wrapper
//
compiler.create = function create(options, ast) {
  return new Compiler(options, ast);
};

//
// ### function execute ()
// Compiles code and returns function
//
Compiler.prototype.execute = function execute() {
  var self = this,
      buffer = this.buffer;

  if (this.ast[0] === 'topLevel') {
    this.ast[1].forEach(function(chunk) {
      switch (chunk[0]) {
        case 'code':
          buffer.push(chunk[1]);
          break;
        case 'grammar':
          self.compileGrammar(chunk.slice(0));
          break;
      }
    });
  }

  return buffer.join('');
};

//
// ### function compileGrammar (ast)
// #### @ast {Array} source code AST
// Compiles grammar and pushes it's contents into the internal buffer
//
Compiler.prototype.compileGrammar = function compileGrammar(ast) {
  var self = this,
      name = ast[0],
      parent = ast[1] || 'AbstractGrammar',
      buffer = this.buffer;

  // Prelude
  buffer.push(
    'function ', name, '(source) {',
    parent, '.call(this, source);',
    '};',
    'require("util").inherits(', name, ',', parent, ');'
  );

  // Rules
  ast[2].forEach(function(rule) {
    switch (rule[0]) {
      case 'rule':
        buffer.push(
          name, '.prototype._rule_', rule[1],
          ' = function _rule_', rule[1], '() {');
        self.compileRule(rule[2]);
        buffer.push('};');
    }
  });
};

//
// ### function compileRule (body)
// #### @body {Array} rule's body
// Compiles rule's body and pushes it's contents into the internal buffer
//
Compiler.prototype.compileRule = function compileRule(body) {
  var self = this,
      buffer = this.buffer;

  body.forEach(function(chunk) {
    // TODO: generate chunk bodies
  });
};
