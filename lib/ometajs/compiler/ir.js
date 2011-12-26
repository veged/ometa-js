var ometajs = require('../../ometajs'),
    util = require('util');

//
// [
//   [
//     'grammar', 'name', 'parent',
//     [
//       'rule', 'name',
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
//     ]
//   ],
//   [
//     'code', '1 + 3'
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

IR.prototype.optimize = function optimize() {
};

IR.prototype.render = function render() {
  var buf = [];

  function body(nodes, op) {
    if (nodes.length === 0) {
      buf.push('return true;');
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
        buf.push('function ', ast[1], '() {');
        if (ast[2] !== null) buf.push(ast[2], '.call(this)');

        ast[3].forEach(function(rule) {
          buf.push(
            ast[1], '.prototype._rule_', rule[1],
            ' = function() {'
          );
          body(rule[2], ' && ');
          buf.push('};');
        });

        buf.push('};');
        buf.push('exports.', ast[1], ' = ', ast[1], ';');

        if (ast[2] !== null) {
          buf.push('require("util").inherits(', ast[1], ', ', ast[2], ');');
        }
        break;
      case 'code':
        buf.push(ast[1]);
        break;
      case 'choice':
        // Each choice should be wrapped in atomic
        body(ast[1].map(function(nodes) {
          return ['atomic', nodes];
        }), ' || ');
        break;
      case 'atomic':
        buf.push('this.atomic(function() {');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'lookahead':
        buf.push('this.atomic(function() {');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'list':
        buf.push('this.list(function() {');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'rule':
      case 'super':
        buf.push('this.', ast[0] === 'rule' ? 'rule' : '_super', '(', ast[1]);
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
      case 'predicate':
        buf.push('this.', ast[0], '(function() {');
        traverse(ast[1]);
        buf.push('})');
        break;
    }
  };

  traverse(this.optimize());

  return buf.join('');
};
