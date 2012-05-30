var ometajs = require('../../lib/ometajs'),
    fs = require('fs');

ometajs.root = __dirname + '/../../lib/ometajs';

exports.ometajs = ometajs;

exports.translate = function translate(name, options) {
  var code = fs.readFileSync(__dirname + '/../files/' + name + '.ometajs');
  return ometajs.translateCode(code.toString(), options);
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
