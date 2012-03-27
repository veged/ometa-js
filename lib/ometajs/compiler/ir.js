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
  var context = [];
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
              context = rule[2],
              rule[3].map(traverse)
            ];
          })
        ];
      case 'choice':
        if (ast[1].length === 1 && ast[1][0].length === 1) {
          var next = ast[1][0][0];

          // choice+atomic
          if (next[0] === 'atomic') {
            // Lift arguments
            context.push.apply(context, next[1]);
            return traverse(['choice', [next[2]]]);
          }
        }
        return ['choice', ast[1].map(function(nodes) {
          return nodes.map(traverse);
        })];
      case 'atomic':
        if (ast[2].length === 1) {
          var next = ast[2][0];
          switch (next[0]) {
            // atomic+atomic
            case 'atomic':
              // Merge arguments
              return traverse(['atomic', ast[1].concat(next[1]), next[2]]);
            // atomic+match
            case 'match':
              // No args here, definitely
              return traverse(next);
            case 'list':
              // Lift arguments to upper context
              context.push.apply(context, ast[1]);
              return traverse(next);
          }
        }
        return ['atomic', ast[1], ast[2].map(traverse)];
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

  function args(list) {
    // Add variables for arguments
    if (list.length > 0) {
      list.forEach(function(arg, i) {
        buf.push(i === 0 ? 'var ' : ', ');
        buf.push(arg);
      });
      buf.push(';');
    }
  };

  function traverse(ast) {
    switch (ast[0]) {
      case 'grammar':
        buf.push('var ', ast[1], ' = function ', ast[1], '(source) {');
        buf.push(ast[2], '.call(this, source)');
        buf.push('};');

        buf.push(ast[1], '.match = ', ast[2], '.match;');
        buf.push(ast[1], '.matchAll = ', ast[2], '.matchAll;');

        buf.push('exports.', ast[1], ' = ', ast[1], ';');

        buf.push('require("util").inherits(', ast[1], ', ', ast[2], ');');

        ast[3].forEach(function(rule) {
          buf.push(
            ast[1], '.prototype[', JSON.stringify(rule[1]), ']',
            ' = function() {'
          );

          args(rule[2]);

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
        buf.push('this._atomic(function() {');
        args(ast[1]);
        buf.push('return ');
        body(ast[2], ' && ');
        buf.push('})');
        break;
      case 'store':
        buf.push('((', ast[1], ' = this._getIntermediate()), true)');
        break;
      case 'lookahead':
        buf.push('this._atomic(function() {return ');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'not':
        buf.push('this._atomic(function() {return !(');
        body(ast[1], ' && ');
        buf.push(')}, true)');
        break;
      case 'list':
        buf.push('this._list(function() {return ');
        body(ast[1], ' && ');
        buf.push('})');
        break;
      case 'chars':
        buf.push('this._list(function() {return ');
        body(ast[1], ' && ');
        buf.push('}, true)');
        break;
      case 'exec':
        buf.push('this._exec(', ast[1], ')');
        break;
      case 'predicate':
        buf.push('(', ast[1], ')');
        break;
      case 'rule':
        if (ast[1] === 'anything') {
          buf.push('this._skip()');
          break;
        }
      case 'super':
        buf.push(
          'this.', ast[0] === 'rule' ? '_rule' : '_super', '(',
          JSON.stringify(ast[1].replace(/^@/, '')),
          ',',
          (/^@/.test(ast[1]) || ast[1] === 'token') ? 'true': 'false'
        );
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
        buf.push('this._match(', ast[1], ')');
        break;
      case 'any':
      case 'many':
      case 'optional':
        buf.push('this._', ast[0], '(function() {return ');
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

  return ometajs.utils.beautify(buf.join(''));
};
