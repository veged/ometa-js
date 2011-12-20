var compiler = exports;

//
// We'll introduce an IR (Intermediate Representation) here.
// Language specs are following:
// [
//   ['code', ['host', ['and', ['code']], 'chunks'] ],
//   ['and', [ ['code', [...] ], ['or', [...]] ]
//   ['or', [ ... ] ]
// ]
//

function IR() {
  this.ast = this.current = [];
  this.stack = [this.ast];
};

//
// ### function enter (type)
// #### @type {String} node type
//
IR.prototype.enter = function enter(type) {
  this.stack.push(this.current);

  var current = [type, []];
  this.push(current);
  this.current = current[1];

  return this;
};

//
// ### function leave ()
//
IR.prototype.leave = function leave() {
  this.current = this.stack.pop();

  return this;
};

//
// ### function push (value)
// #### @value {String} value to push into node
//
IR.prototype.push = function push() {
  this.current.push.apply(this.current, arguments);

  return this;
};

//
// ### function render ()
// Renders IR into javascript
//
IR.prototype.render = function render() {
  var buffer = [];

  function traverse(node) {
    if (!Array.isArray(node)) return node;

    var last = node[1].length - 1;

    function visit(separator) {
      node[1].forEach(function(node, i) {
        buffer.push(traverse(node));
        if (separator && i !== last) buffer.push(separator);
      });
    }

    switch (node[0]) {
      case 'code':
        visit();
        break;
      case 'and':
        visit(' && ');
        break;
      case 'or':
        visit(' || ');
        break;
    }
  };

  traverse(this.ast);

  return buffer.join('');
};


//
// ### function Compiler (options, ast)
// #### @options {Object} compiler options
// #### @ast {Array} source code AST
// Compiler constructor
//
function Compiler(options, ast) {
  this.options = options;
  this.ast = ast;
  this.ir = new IR();
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
      ir = this.ir;

  if (this.ast[0] === 'topLevel') {
    this.ast[1].forEach(function(chunk) {
      switch (chunk[0]) {
        case 'code':
          ir.enter('code').push(chunk[1]).leave();
          break;
        case 'grammar':
          self.compileGrammar(chunk.slice(0));
          break;
      }
    });
  } else {
    throw new Error('Expected top node to have type topLevel');
  }

  return ir.render();
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
      ir = this.ir;

  // Prelude

  ir.enter('code').push(
    'function ', name, '(source) {',
    parent, '.call(this, source);',
    '};',
    'require("util").inherits(', name, ',', parent, ');'
  ).leave();

  // Rules
  ast[2].forEach(function(rule) {
    switch (rule[0]) {
      case 'rule':
        ir.enter('code').push(
          name, '.prototype._rule_', rule[1],
          ' = function _rule_', rule[1], '() {'
        ).leave();

        var context = { id: 0, rule: rule[1], args: [] };
        this.ir.enter('and');
        rule[2].forEach(function(operation) {
          self.compileOperation(operation, context);
        });
        this.ir.leave();

        buffer.push('};');
        break;
      default:
        throw new Error('Unexpected node type: ' + rule[0] + ', expected rule');
    }
  });
};

//
// ### function compileOperation (op)
// #### @opy {Array} opeartion
// #### @context {Object} compilation context
// Compiles operation and pushes it's contents into the internal buffer
//
Compiler.prototype.compileOperation = function compileOperation(op, context) {
  switch(op[0]) {
    case 'match':
      if (op[1] !== null) throw new Error('Not implemented yet');
      this.ir.enter('code').push('this._rule_', op[2], '()').leave();
      break;
    case 'call':
      if (op[1] !== null) throw new Error('Not implemented yet');
      this.ir
          .enter('and')
          .enter('code').push(
            'this.enter(', JSON.stringify(context.rule), ',', context.id++, ')'
          )
          .leave()
          .enter('code')
          .push(
            'this.simulate(function(', context.args.join(','), ') {',
            op[3],
            '}, ', JSON.stringify(context.args), ')'
          )
          .leave()
          .enter('code')
          .push('this._rule_', op[2], '()')
          .leave()
          .enter('code')
          .push('this.leave()')
          .leave();
      break;
    case 'arg':
      this.ir.enter('and')
      this.compileOperation(op[1], context);
      this.ir
          .enter('code')
          .push(
            'this.set(', JSON.stringify(op[2]), ')'
          )
          .leave();
      this.ir.leave();
      context.args.push(op[2]);
      break;
    case 'choice':
      this.ir.enter('or');
      for (var i = 1; i < op.length; i++) {
        this.ir.enter('and');
        for (var j = 0; j < op[i].length; j++) {
          this.compileOperation(op[i][j], context);
        }
        this.ir.leave();
      }
      this.ir.leave();
      break;
    case 'list':
      this.ir
          .enter('and')
          .enter('code')
          .push('this.enter(', JSON.stringify(context.rule), ')')
          .leave()
          .enter('code')
          .push('this.open("list")')
          .leave();

      for (var i = 1; i < op.length; i++) {
        this.compileOperation(op[i], context);
      }

      this.ir
          .enter('code')
          .push('this.close()')
          .leave()
          .enter('code')
          .push('this.leave()')
          .leave();
      break;
    case 'super':
      var match = op[1];
      if (match[1] !== null) throw new Error('Not implemented yet');

      this.ir
          .enter('code')
          .push(
            'this.constructor.super_.prototype._rule_', match[2], '.call(this)'
          )
          .leave();
      break;
    case 'body':
    case 'result':
      this.ir
          .enter('code')
          .push(
            'this.', op[0], '(function(', context.args.join(','), ') {',
            op[1],
            '}, ', JSON.stringify(context.args), ')'
          )
          .leave();
      break;
    case 'any':
    case 'many':
    case 'optional':
      this.ir
          .enter('code')
          .push('this.', op[0], '(function() {');

      this.compileOperation(op[1], context);

      this.ir
          .push('})')
          .leave();
      break;
    default:
      throw new Error('Unexpected node type:' + op[0]);
  }
};
