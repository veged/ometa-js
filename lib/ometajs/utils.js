var utils = exports;

var uglify = require('uglify-js');

utils.expressionify = function expressionify(code) {
  var ast = uglify.parser.parse(code);

  function traverse(ast) {
    if (!Array.isArray(ast)) return ast;
    switch (ast[0]) {
      case 'toplevel':
        if (ast[1].length === 1 && ast[1][0][0] !== 'block') {
          return ast;
        } else {
          return ['toplevel', [[
            'call',
            [
              'dot',
              [
                'function',
                null,
                [],
                ast[1].map(traverse)
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
