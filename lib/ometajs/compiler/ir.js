var ometajs = require('../../ometajs'),
    util = require('util');

//
// [
//   [
//     'grammar', 'name', 'parent',
//     [ [
//       'rule', 'name', [ 'var1', 'var2', 'var3'],
//       [
//         [ 'atomic', [
//           [ 'match', 'anything' ],
//           [ 'rule', 'anything' ],
//           [ 'rule', 'anything', ['body1', 'body2']],
//           [ 'super', 'anything' ],
//           [ 'any', [ 'rule', 'number' ] ]
//         ]],
//         [ 'choice', [
//           [.. ops ..],
//           [.. ops ..]
//         ]]
//       ]
//     ] ]
//   ],
//   [
//     'code', ['1 + 3']
//   ]
// ]
//

//
// ### function IR ()
// Intermediate representation
//
function IR() {
  ometajs.compiler.ast.call(this);
};
util.inherits(IR, ometajs.compiler.ast);
module.exports = IR;

IR.prototype.optimize = function optimize() {
  return this.result;
};

IR.prototype.render = function render() {
  var buf = [];

  function body(nodes, op) {
    var flag = false;
    if (nodes.length === 0) {
      buf.push('true');
    } else {
      nodes.forEach(function(node, i) {
        if (i !== 0) buf.push(op);
        traverse(node);
      });
    }
  };

  function traverse(ast) {
    switch (ast[0]) {
      case 'grammar':
        buf.push('function ', ast[1], '(source) {');
        if (ast[2] === null) {
          buf.push('AbstractGrammar.call(this, source)');
        } else {
          buf.push(ast[2], '.call(this, source)');
        }
        buf.push('};');
        buf.push('exports.', ast[1], ' = ', ast[1], ';');

        if (ast[2] !== null) {
          buf.push('require("util").inherits(', ast[1], ', ', ast[2], ');');
        }

        ast[3].forEach(function(rule) {
          buf.push(
            ast[1], '.prototype._rule_', rule[1],
            ' = function() {'
          );

          // Add variables for arguments
          if (rule[2].length > 0) {
            rule[2].forEach(function(arg, i) {
              buf.push(i === 0 ? 'var ' : ', ');
              buf.push(arg);
            });
            buf.push(';');
          }

          buf.push('return ');
          body(rule[3], ' && ');
          buf.push('};');
        });

        break;
      case 'code':
        ast[1].forEach(function(item) {
          buf.push(item);
        });
        break;
      case 'choice':
        // Each choice should be wrapped in atomic
        body(ast[1].map(function(nodes) {
          return ['atomic', nodes];
        }), ' || ');
        break;
      case 'atomic':
        buf.push('this.atomic(function() {return ');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'store':
        buf.push('this.store(function(_) {', ast[1], ' = _})');
        break;
      case 'lookahead':
        buf.push('this.atomic(function() {return ');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'list':
        buf.push('this.list(function() {return ');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'chars':
        buf.push('this.list(function() {return ');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'exec':
      case 'predicate':
        buf.push('this.', ast[0], '(function() {', ast[1], '})');
        break;
      case 'rule':
      case 'super':
        buf.push('this.', ast[0] === 'rule' ? 'rule' : '_super', '(');
        buf.push(JSON.stringify(ast[1]));
        if (ast[2]) {
          buf.push('[');
          ast[2].forEach(function(code, i) {
            if (i !== 0) buf.push(',');
            buf.push('function() {', code, '}');
          });
          buf.push(']');
        }
        buf.push(')');
        break;
      case 'match':
        buf.push('this.match(', ast[1], ')');
        break;
      case 'any':
      case 'many':
      case 'optional':
        buf.push('this.', ast[0], '(function() {return ');
        body(ast[1], ' && ');
        buf.push('})');
        break;
    }
  };

  var ast = this.optimize();
  ast.forEach(function(node) {
    traverse(node);
  });

  return buf.join('');
};
