var Cons = require('./cons').Cons;

var sourcemap = require('source-map');

function SourceMap(cons) {
  this.cons = cons;
  this.result = cons.toString();
};
exports.SourceMap = SourceMap;

SourceMap.prototype.traverseCons = function traverseCons(cons, callback) {
  var queue = [ cons ];

  while (queue.length > 0) {
    var current = queue.pop();

    if (current.left && !current.right && !(current.left instanceof Cons)) {
      callback.call(this, current.left, current.info);
      continue;
    }

    if (current.right) queue.push(current.right);
    if (current.left) queue.push(current.left);
  }
};

SourceMap.prototype.getLineOffset = function getLineOffset(source, offset) {
  var lines = source.slice(0, offset).split(/\r\n|\r|\n/g);

  // NOTE: Both line and column should be > 0
  return {
    line: lines.length,
    column: lines[lines.length - 1].length
  };
};

SourceMap.prototype.generate = function generate(options) {
  var generator = new sourcemap.SourceMapGenerator(options),
      cons = this.cons,
      line = 1,
      column = 0;

  // Get sorted of list of ranges
  this.traverseCons(cons, function(str, info) {
    var generated = {
          line: line,
          column: column
        },
        original = this.getLineOffset(info.source, info.offset);

    // Increment position
    var lines = str.split(/\r\n|\r|\n/g);
    if (lines.length > 1) {
      line += lines.length - 1;
      column = 0;
    }
    column += lines[lines.length - 1].length;

    console.log('[%d, %d] => [%d, %d]', original.line - 1, original.column, generated.line - 1, generated.column);

    // Insert mapping
    generator.addMapping({
      generated: generated,
      original: original,
      source: options.original
    });
  });

  return generator.toString();
};
