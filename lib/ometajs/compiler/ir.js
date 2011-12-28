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
  function traverse(ast) {
    // atomic+atomic = atomic
    // atomic+match = match
    // atomic+list = list
    // choice+1 = atomic
    switch (ast[0]) {
      case 'grammar':
        return [
          'grammar',
          ast[1],
          ast[2],
          ast[3].map(function(rule) {
            return [
              'rule',
              rule[1],
              rule[2],
              rule[3].map(traverse)
            ];
          })
        ];
      case 'choice':
        if (ast[1].length === 1 && ast[1][0].length === 1) {
          // choice+atomic
          if (ast[1][0][0][0] === 'atomic') {
            return traverse(['choice', [ast[1][0][0][1]]]);
          }
        }
        return ['choice', ast[1].map(function(nodes) {
          return nodes.map(traverse);
        })];
      case 'atomic':
        if (ast[1].length === 1) {
          switch (ast[1][0][0]) {
            case 'atomic':
              return traverse(['atomic', ast[1][0][1]]);
            case 'list':
            case 'match':
              return ast[1][0];
          }
        }
        return ['atomic', ast[1].map(traverse)];
      case 'lookahead':
      case 'not':
      case 'list':
      case 'chars':
      case 'any':
      case 'many':
      case 'optional':
        return [ast[0], ast[1].map(traverse)];
      default:
        return ast;
    }
  }

  return this.result.map(traverse);
};

IR.prototype.render = function render() {
  var buf = [];

  function multibody(nodes, op, fn) {
    var flag = false;
    if (nodes.length === 0) {
      buf.push('true');
    } else {
      nodes.forEach(function(node, i) {
        if (i !== 0) buf.push(op);
        fn(node);
      });
    }
  };

  function body(nodes, op) {
    return multibody(nodes, op, traverse);
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
        buf.push('(');
        multibody(ast[1], ' || ', function(nodes) {
          return body(nodes, ' && ');
        });
        buf.push(')');
        break;
      case 'atomic':
        buf.push('this.atomic(function() {return ');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'store':
        buf.push('((', ast[1], ' = this.intermediate), true)');
        break;
      case 'lookahead':
        buf.push('this.atomic(function() {return ');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'not':
        buf.push('this.atomic(function() {return !(');
        body(ast[1], ' && ');
        buf.push(')}, true)');
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
        buf.push('this.exec(', ast[1], ')');
        break;
      case 'predicate':
        buf.push('(', ast[1], ')');
        break;
      case 'rule':
      case 'super':
        buf.push('this.', ast[0] === 'rule' ? 'rule' : '_super', '(');
        buf.push(JSON.stringify(ast[1]));
        if (ast[2]) {
          buf.push(',[');
          ast[2].forEach(function(code, i) {
            if (i !== 0) buf.push(',');
            buf.push(code);
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
      default:
        throw new Error('Unknown IR node type:' + ast[0]);
    }
  };

  var ast = this.optimize();
  ast.forEach(function(node) {
    traverse(node);
  });

  return buf.join('');
};
