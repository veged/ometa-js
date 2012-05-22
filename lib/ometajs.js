//
// OmetaJS
//

var ometajs = exports;

// Export utils
ometajs.utils = require('./ometajs/utils');

// Export lexer
ometajs.lexer = require('./ometajs/lexer');

// Export compiler
ometajs.compiler = {};
ometajs.compiler.ast = require('./ometajs/compiler/ast');
ometajs.compiler.ir = require('./ometajs/compiler/ir');
ometajs.compiler.create = require('./ometajs/compiler/core').create;

// Export parser
ometajs.parser = require('./ometajs/parser');

// Compiler routines
ometajs.core = {};
ometajs.core.AbstractParser = require('./ometajs/core/parser');
ometajs.core.AbstractGrammar = require('./ometajs/core/grammar');

// Export globals
ometajs.globals = require('./ometajs/globals');

// Export API
ometajs.compile = require('./ometajs/api').compile;

// Export CLI
ometajs.cli = require('./ometajs/cli');
