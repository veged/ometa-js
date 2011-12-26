var compiler = exports,
    util = require('util'),
    ometajs = require('../../ometajs');

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
  this.tree = ['code', []];
  this.current = this.tree[1];
  this.stack = [this.current];
};

//
// ### function enter (type, fn)
// #### @type {String} node type
// #### @fn {Array|String|Function} that'll collect body or body itself
//
IR.prototype.enter = function enter(type, fn) {
  this.stack.push(this.current);

  var current = [type, []];
  this.push(current);
  this.current = current[1];

  if (Array.isArray(fn)) {
    this.push.apply(this, fn);
  } else if (typeof fn === 'string') {
    this.push(fn);
  } else if (typeof fn === 'function') {
    fn.call(this);
  }

  return this.leave();
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

  function optimize(node) {
    if (!Array.isArray(node)) return node;
    if (node[0] !== 'code' && node[1].length === 1) {
      return optimize(node[1][0]);
    } else {
      return [
        node[0],
        node[1].map(optimize)
      ];
    }
  }

  function traverse(node) {
    if (!Array.isArray(node)) {
      buffer.push(node);
      return;
    }

    var last = node[1].length - 1,
        source = node[0];

    function visit(separator) {
      node[1].forEach(function(node, i) {
        var target = node[0];

        if (Array.isArray(node) &&
            target === 'or' && source == 'and') {
          buffer.push('(');
          traverse(node)
          buffer.push(')');
        } else {
          traverse(node);
        }
        if (separator && i !== last) buffer.push(separator);
      });
    }

    switch (source) {
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

  traverse(optimize(this.tree));

  return buffer.join('');
};


//
// ### function Compiler (ast, options)
// #### @ast {Array} source code AST
// #### @options {Object} (optional) compiler options
// Compiler constructor
//
function Compiler(ast, options) {
  IR.call(this);

  this.ast = ast;
  this.options = options || {};

  if (this.options.globals !== false) {
    this.addGlobals(this.options.root || 'ometajs');
  }
};
util.inherits(Compiler, IR);

//
// ### function addGlobals (root)
// #### @root {String} path to module
// Add globlas
//
Compiler.prototype.addGlobals = function addGlobals(root) {
  this.enter('code', function() {
    this.push('var ometajs_ = require(', JSON.stringify(root), ');');

    var keys = Object.keys(ometajs.globals);
    for (var i = 0; i < keys.length; i++) {
      this.push('var ', keys[i], ' = ometajs_.globals.', keys[i], ';');
    }
  });
};

//
// ### function create (options, ast)
// #### @ast {Array} source code AST
// #### @options {Object} (optional) compiler options
// Compiler constructor wrapper
//
compiler.create = function create(ast, options) {
  return new Compiler(ast, options);
};

//
// ### function execute ()
// Compiles code and returns function
//
Compiler.prototype.execute = function execute() {
  var self = this;

  this.ast.forEach(function(chunk) {
    switch (chunk[0]) {
      case 'code':
        self.enter('code', chunk[1]);
        break;
      case 'grammar':
        self.compileGrammar(chunk.slice(1));
        break;
    }
  });

  return this.render();
};

//
// ### function compileGrammar (ast)
// #### @ast {Array} source code AST
// Compiles grammar and pushes it's contents into the internal buffer
//
Compiler.prototype.compileGrammar = function compileGrammar(ast) {
  var self = this,
      name = ast[0],
      parent = ast[1] || 'AbstractGrammar';

  // Prelude

  this.enter('code', function() {
    this.push(
      'function ', name, '(source) {',
      parent, '.call(this, source);',
      '};',
      'exports.', name, ' = ', name, ';',
      'require("util").inherits(', name, ',', parent, ');'
    );

    // Rules
    ast[2].forEach(function(rule) {
      switch (rule[0]) {
        case 'rule':
          self.enter('code', function() {
            this.push(
              name, '.prototype._rule_', rule[1],
              ' = function _rule_', rule[1], '() {',
              'return '
            );

            var context = {
              rule: rule[1],
              args: [],
              id: 0,
              enter: function(fn) {
                self.enter('code', function() {
                  this.push(
                    'this.enter(',
                    JSON.stringify(context.rule),
                    ',',
                    context.id++,
                    ',function() {',
                    'return '
                  );
                  this.enter('and', function() {
                    this.enter('code', 'true');

                    fn.call(this);
                  });

                  this.push('})');
                });
              }
            };

            this.enter('and', function() {
              this.enter('code', 'true');
              rule[2].forEach(function(operation) {
                self.compileOperation(operation, context);
              });
            });
            this.push('};');
          });
          break;
        default:
          throw new Error(
            'Unexpected node type: ' + rule[0] + ', ' +
            'expected rule'
          );
      }
    });
  });
};

//
// ### function compileOperation (op)
// #### @opy {Array} opeartion
// #### @context {Object} compilation context
// Compiles operation and pushes it's contents into the internal buffer
//
Compiler.prototype.compileOperation = function compileOperation(op, context) {
  var self = this;

  switch(op[0]) {
    case 'null':
      this.enter('code', ['this.match(null)']);
      break;
    case 'bool':
    case 'number':
    case 'string':
      this.enter('code', ['this.match(', JSON.stringify(op[1]), ')']);
      break;
    case 'match':
      if (op[1] !== null) throw new Error('Not implemented yet');
      this.enter('code', ['this.rule(', JSON.stringify(op[2]), ')']);
      break;
    case 'call':
      if (op[1] !== null) throw new Error('Not implemented yet');
      this.enter('code', function() {
        this.push('this.rule(', JSON.stringify(op[2]), ',[');
        op[3].forEach(function(body, i) {
          self.push('function() {', body, '}');
          if (i !== op[3].length - 1) self.push(', ');
        });
        this.push('])');
      });
      break;
    case 'arg':
      self.enter('and', function() {
        self.compileOperation(op[1], context);
        this.enter('code', [
          'this.get(function(_) {',
          op[2], '=_',
          '})']);
      });
      context.args.push(op[2]);
      break;
    case 'choice':
      self.enter('or', function() {

        // Translate every body
        for (var i = 1; i < op.length; i++) {
          context.enter(function() {
            this.enter('and', function() {

              for (var j = 0; j < op[i].length; j++) {
                self.compileOperation(op[i][j], context);
              }
            });
          });
        }

      });
      break;
    case 'list':
    case 'chars':
      context.enter(function() {
        self.enter('and', function() {
          this.enter('code', ['this.open(', JSON.stringify(op[0]), ')']);

          for (var i = 1; i < op.length; i++) {
            self.compileOperation(op[i], context);
          }

          this.enter('code', ['this.close(', JSON.stringify(op[0]), ')']);
        });
      });
      break;
    case 'super':
      var match = op[1];
      if (match[1] !== null) throw new Error('Not implemented yet');

      this.enter('code', [
        'this._super(', JSON.stringify(match[2]), ')'
      ]);
      break;
    case 'body':
    case 'result':
      var type = op[0] === 'body' ? 'exec' : 'body';

      this.enter('code', [
        'this.', type, '(function() {',
        op[1],
        '})'
      ]);
      break;
    case 'any':
    case 'many':
    case 'optional':
      this.enter('code', function() {
        this.push('this.', op[0], '(function() { return ');

        self.compileOperation(op[1], context);

        this.push('})')
      });
      break;
    case 'look-ahead':
      this.enter('and', function() {
        this.enter('code', 'this.open("lookahead")');

        self.compileOperation(op[1], context);

        this.enter('code', 'this.close("lookahead")');
      });
      break;
    case 'predicate':
      this.enter('code', [
         'this.predicate(function() {',
         op[1],
         '})'
      ]);
      break;
    default:
      throw new Error('Unexpected node type:' + op[0]);
  }
};