var globals = exports,
    ometajs = require('../ometajs');

globals.AbstractGrammar = ometajs.core.AbstractGrammar;

// Lazy getters for BSJS stuff
var bsjs = undefined;

function lazyDescriptor(property) {
  return {
    enumerable: true,
    get: function get() {
      if (bsjs === undefined) bsjs = require('./grammars/bsjs');

      return bsjs[property];
    }
  };
}

Object.defineProperties(globals, {
  BSJSParser: lazyDescriptor('BSJSParser'),
  BSJSIdentity: lazyDescriptor('BSJSIdentity'),
  BSJSTranslator: lazyDescriptor('BSJSTranslator')
});
