function SplayTree(sort) {
  this.sort = sort;
  this.root = null;
};
exports.SplayTree = SplayTree;

// XXX: Make me iterative
SplayTree.prototype.flatten = function flatten(node) {
  if (!this.root) return [];
  if (!node) return this.flatten(this.root);

  var result = [];

  if (node.left) result = this.flatten(node.left);
  result.push(node);
  if (node.right) result = result.concat(this.flatten(node.right));

  return result;
};

SplayTree.prototype.insert = function insert(key, value) {
  if (this.root === null) {
    this.root = new SplayNode(key, value);
    return;
  }

  var parent = this.findNode(key, false),
      node = new SplayNode(key, value);

  if (this.sort(parent.key, key) <= 0) {
    parent.setRight(node);
  } else {
    parent.setLeft(node);
  }

  this.splay(node);
};

SplayTree.prototype.findNode = function findNode(key, exact) {
  var current = this.root,
      next = current;

  while (next !== null) {
    current = next;

    if (this.sort(current.key, key) <= 0) {
      if (exact && this.sort(current.key, key) === 0) break;
      next = current.right;
    } else {
      next = current.left;

      if (exact && !next) {
        do {
          current = current.parent;
        } while (current && this.sort(current.key, key) > 0);
        break;
      }
    }
  }
  if (exact && (!current || this.sort(current.key, key) !== 0)) return null;

  return current;
};

SplayTree.prototype.find = function find(key) {
  var node = this.findNode(key, true);
  return node && node.value;
};

SplayTree.prototype.splay = function splay(node) {
  while (node !== this.root) {
    if (node.parent === this.root) {
      var root = this.root;

      // Zig step
      if (root.left === node) {
        // Left case
        root.setLeft(node.right);
        node.setRight(root);
      } else {
        // Right case
        root.setRight(node.left);
        node.setLeft(root);
      }

      this.root = node;
      this.root.parent = null;
    } else {
      // Swap nodes in tree
      var parent = node.parent,
          gparent = parent.parent,
          ggparent = gparent.parent,
          side = ggparent && (ggparent.left === gparent ? 'left' : 'right');

      if (node.parent.left === node &&
          node.parent.parent.left === node.parent ||
          node.parent.right === node &&
          node.parent.parent.right === node.parent) {
        // Zig-zig step
        if (node.parent.left === node) {
          // Left-left case
          gparent.setLeft(parent.right);
          parent.setRight(gparent);
          parent.setLeft(node.right);
          node.setRight(parent);
        } else {
          // Right-right case
          gparent.setRight(parent.left);
          parent.setLeft(gparent);
          parent.setRight(node.left);
          node.setLeft(parent);
        }
      } else {
        // Zig-zag step
        if (node.parent.right === node) {
          // Left-right case
          gparent.setLeft(node.right);
          parent.setRight(node.left);
          node.setRight(gparent);
          node.setLeft(parent);
        } else {
          // Right-left case
          gparent.setRight(node.left);
          parent.setLeft(node.right);
          node.setLeft(gparent);
          node.setRight(parent);
        }
      }

      // Put node back in tree
      if (ggparent) {
        ggparent[side] = node;
      } else {
        this.root = node;
      }
      node.parent = ggparent;
    }
  }
};

function SplayNode(key, value) {
  this.key = key;
  this.value = value;
  this.parent = null;
  this.left = null;
  this.right = null;
}

SplayNode.prototype.setLeft = function setLeft(node) {
  this.left = node;
  if (node) node.parent = this;
};

SplayNode.prototype.setRight = function setRight(node) {
  this.right = node;
  if (node) node.parent = this;
};
