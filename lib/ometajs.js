//
// OmetaJS
//

var ometajs = exports;

// Export lexer
ometajs.lexer = require('./ometajs/lexer');

// Export API
ometajs.translateCode = require('./ometajs/api').translateCode;
ometajs.evalCode = require('./ometajs/api').evalCode;
