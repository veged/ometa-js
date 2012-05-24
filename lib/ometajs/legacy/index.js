var ometajs = require('../../ometajs');

// Include various utils
ometajs.utils.extend(exports, require('./utils'));

// Include grammars
ometajs.globals = exports;
ometajs.utils.extend(exports, require('./core'));
ometajs.utils.extend(exports, require('./parsers'));
