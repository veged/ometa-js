var api = exports;

var ometajs = require('../ometajs');

api.translateCode = function translateCode(code, options) {
  var parser = ometajs.parser.create(code),
      compiler = ometajs.compiler.create(options, parser.execute());

  return compiler.execute();
};

api.evalCode = function evalCode(code) {
};
