function Cons(info, value) {
  this.info = info;
  this.left = value;
  this.right = null;
};
exports.Cons = Cons;

Cons.prototype.cons = function cons(val) {
  var res = new Cons(this.info, this);
  res.right = val;

  if (!(res.right instanceof Cons)) {
    res.right = new Cons(this.info, res.right);
  }

  return res;
};

Cons.prototype.getMapping = function getMapping() {
};

Cons.prototype.toString = function toString() {
  if (this.right === null) return this.left;

  return this.left + this.right;
};

function ArrCons(info, values) {
  this.info = info;
  this.values = values;
};

ArrCons.prototype.join = function join(sep) {
  if (this.values.length === 0) return new Cons(this.info, '');

  return this.values.reduce(function(prev, next) {
    return prev.cons(sep).cons(next);
  });
};
exports.ArrCons = ArrCons;
