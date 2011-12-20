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
ometajs.core = require('./ometajs/core');

// Export compiler
ometajs.compiler = require('./ometajs/compiler');

// Export API
ometajs.translateCode = require('./ometajs/api').translateCode;
ometajs.evalCode = require('./ometajs/api').evalCode;
