//
// OmetaJS
//

var ometajs = exports;

// Export lexer
ometajs.lexer = require('./ometajs/lexer');

// Export parser
ometajs.parser = require('./ometajs/parser');

// Export API
ometajs.translateCode = require('./ometajs/api').translateCode;
ometajs.evalCode = require('./ometajs/api').evalCode;
