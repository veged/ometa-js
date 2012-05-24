var utils = exports;

var uglify = require('uglify-js');

utils.extend = function extend(target, source) {
  Object.keys(source).forEach(function (key) {
    target[key] = source[key];
  });
};

utils.beautify = function beautify(code) {
  var ast = uglify.parser.parse(code);
  return uglify.uglify.gen_code(ast, { beautify: true });
};

utils.expressionify = function expressionify(code) {
  var ast = uglify.parser.parse('(function(){\n' + code + '\n})');

  ast[1] = ast[1][0][1][3];

  function traverse(ast) {
    if (!Array.isArray(ast)) return ast;
    switch (ast[0]) {
      case 'toplevel':
        if (ast[1].length === 1 && ast[1][0][0] !== 'block') {
          return ast;
        } else {
          var children = ast[1][0][0] === 'block' ? ast[1][0][1] : ast[1];

          return ['toplevel', [[
            'call', [
              'dot', [
                'function', null, [],
                children.map(function(child, i, children) {
                  return (i == children.length - 1) ? traverse(child) : child;
                })
              ],
              'call'
            ],
            [ ['name', 'this'] ]
          ]]];
        }
      case 'block':
        // Empty blocks can't be processed
        if (ast[1].length <= 0) return ast;

        var last = ast[1][ast[1].length - 1];
        return [
          ast[0],
          ast[1].slice(0, -1).concat([traverse(last)])
        ];
      case 'while':
      case 'for':
      case 'switch':
        return ast;
      case 'if':
        return [
          'if',
          ast[1],
          traverse(ast[2]),
          traverse(ast[3])
        ];
      case 'stat':
        return [
          'stat',
          traverse(ast[1])
        ];
      default:
        return [
          'return',
          ast
        ]
    }
    return ast;
  }

  return uglify.uglify.gen_code(traverse(ast));
};

utils.merge = function merge(a, b) {
  Object.keys(b).forEach(function(key) {
    a[key] = b[key];
  });
};
