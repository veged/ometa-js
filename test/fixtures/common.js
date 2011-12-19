var ometajs = require('../../lib/ometajs'),
    fs = require('fs');

ometajs.root = __dirname + '/../../lib/ometajs';

exports.ometajs = ometajs;

exports.loadFile = function loadFile(name) {
  return fs.readFileSync(
    __dirname + '/../files/' + name + '.ometajs'
  ).toString()
};

exports.translate = function translate(name, options) {
  var code = exports.loadFile(name);
  return ometajs.translateCode(code, options);
};

exports.compile = function compile(name) {
  var code = fs.readFileSync(__dirname + '/../files/' + name + '.ometajs');
  return ometajs.evalCode(code.toString());
};

exports.require = function compile(name) {
  return require(__dirname + '/../files/' + name);
};

exports.lexems = function(code) {
  var lexer = ometajs.lexer.create(code),
      lexems = [],
      lexem;

  while (lexem = lexer.token()) lexems.push(lexem);

  return lexems;
};

exports.parse = function(code) {
  var parser = ometajs.parser.create(code);

  return parser.execute();
};

exports.ap = function(code) {
  return new ometajs.core.AbstractParser(code);
}

exports.ag = function(code) {
  return new ometajs.core.AbstractGrammar(code);
}
