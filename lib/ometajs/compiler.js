var compiler = exports;

//
// ### function Compiler (options)
// #### @options {Object} compiler options
// Compiler constructor
//
function Compiler(options) {
  this.options = options;
};

//
// ### function create (options)
// #### @options {Object} compiler options
// Compiler constructor wrapper
//
compiler.create = function create(options) {
  return new Compiler(options);
};

//
// ### function compile (code)
// #### @code {String} source ometa code
// Compiles code and returns function
//
Compiler.prototype.compile = function compile(code) {
};
