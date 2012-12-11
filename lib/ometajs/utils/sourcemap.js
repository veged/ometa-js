var Cons = require('./cons').Cons,
    SplayTree = require('./splaytree').SplayTree;

function Range(start, end, value) {
  this.start = start;
  this.end = end;
  this.values = [ value ] ;
};

Range.compare = function compare(a, b) {
  return a - b;
};

function SourceMap(cons) {
  this.ranges = new SplayTree(Range.compare);

  this.deriveRanges(cons);
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

SourceMap.prototype.deriveRanges = function deriveRanges(cons) {
  this.traverseCons(cons, function(str, info) {
    var range = this.ranges.find(info.offset);
    if (range) {
      range.values.push(str);
      return;
    }

    this.ranges.insert(info.offset, new Range(info.offset, info.offset, str));
  });
  console.log(this.ranges);
};
