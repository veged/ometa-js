//
// OmetaJS
//

var ometajs = exports;

// Export utils
ometajs.utils = require('./ometajs/utils');

// Export lexer
ometajs.lexer = require('./ometajs/lexer');

// Export parser
ometajs.parser = require('./ometajs/parser');

// Compiler routines
ometajs.core = {};
ometajs.core.AbstractParser = require('./ometajs/core/parser');
ometajs.core.AbstractGrammar = require('./ometajs/core/grammar');

// Export compiler
ometajs.compiler = require('./ometajs/compiler');

// Export globals
ometajs.globals = require('./ometajs/globals');

// Export API
ometajs.compile = require('./ometajs/api').compile;
