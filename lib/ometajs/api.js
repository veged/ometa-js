var api = exports;

var ometajs = require('../ometajs');

api.translateCode = function translateCode(code, options) {
  var parser = ometajs.parser.create(code),
      compiler = ometajs.compiler.create(options);

  var ast = parser.execute(),
      out = compiler.compile(ast);

  return out;
};

api.evalCode = function evalCode(code) {
};
