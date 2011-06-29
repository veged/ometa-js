/*
  Copyright (c) 2007-2010 Alessandro Warth <awarth@cs.ucla.edu>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

// try to use StringBuffer instead of string concatenation to improve performance

function StringBuffer() {
  this.strings = []
  for (var idx = 0; idx < arguments.length; idx++)
    this.nextPutAll(arguments[idx])
}
StringBuffer.prototype.nextPutAll = function(s) { this.strings.push(s) }
StringBuffer.prototype.contents   = function()  { return this.strings.join("") }
String.prototype.writeStream      = function() { return new StringBuffer(this) }

// make Arrays print themselves sensibly

printOn = function(x, ws) {
  if (x === undefined || x === null)
    ws.nextPutAll("" + x)
  else if (x.constructor === Array) {
    ws.nextPutAll("[")
    for (var idx = 0; idx < x.length; idx++) {
      if (idx > 0)
        ws.nextPutAll(", ")
      printOn(x[idx], ws)
    }
    ws.nextPutAll("]")
  }
  else
    ws.nextPutAll(x.toString())
}

Array.prototype.toString = function() { var ws = "".writeStream(); printOn(this, ws); return ws.contents() }

// delegation

objectThatDelegatesTo = function(x, props) {
  var f = function() { }
  f.prototype = x
  var r = new f()
  for (var p in props)
    if (props.hasOwnProperty(p))
      r[p] = props[p]
  return r
}

// some reflective stuff

ownPropertyNames = function(x) {
  var r = []
  for (name in x)
    if (x.hasOwnProperty(name))
      r.push(name)
  return r
}

isImmutable = function(x) {
   return x === null || x === undefined || typeof x === "boolean" || typeof x === "number" || typeof x === "string"
}

String.prototype.digitValue  = function() { return this.charCodeAt(0) - "0".charCodeAt(0) }

isSequenceable = function(x) { return typeof x == "string" || x.constructor === Array }

// some functional programming stuff

Array.prototype.map = function(f) {
  var r = []
  for (var idx = 0; idx < this.length; idx++)
    r[idx] = f(this[idx])
  return r
}

Array.prototype.reduce = function(f, z) {
  var r = z
  for (var idx = 0; idx < this.length; idx++)
    r = f(r, this[idx])
  return r
}

Array.prototype.delimWith = function(d) {
  return this.reduce(
    function(xs, x) {
      if (xs.length > 0)
        xs.push(d)
      xs.push(x)
      return xs
    },
   [])
}

// Squeak's ReadStream, kind of

function ReadStream(anArrayOrString) {
  this.src = anArrayOrString
  this.pos = 0
}
ReadStream.prototype.atEnd = function() { return this.pos >= this.src.length }
ReadStream.prototype.next  = function() { return this.src.at(this.pos++) }

// escape characters

escapeStringFor = new Object()
for (var c = 0; c < 256; c++)
  escapeStringFor[c] = String.fromCharCode(c)
escapeStringFor["\\".charCodeAt(0)] = "\\\\"
escapeStringFor['"'.charCodeAt(0)]  = '\\"'
escapeStringFor["'".charCodeAt(0)]  = "\\'"
escapeStringFor["\r".charCodeAt(0)] = "\\r"
escapeStringFor["\n".charCodeAt(0)] = "\\n"
escapeStringFor["\t".charCodeAt(0)] = "\\t"
escapeChar = function(c) {
  var charCode = c.charCodeAt(0)
  return charCode > 255 ? String.fromCharCode(charCode) : escapeStringFor[charCode]
}

function unescape(s) {
  if (s.charAt(0) == '\\')
    switch (s.charAt(1)) {
      case '\\': return '\\'
      case 'r':  return '\r'
      case 'n':  return '\n'
      case 't':  return '\t'
      default:   return s.charAt(1)
    }
  else
    return s
}

String.prototype.toProgramString = function() {
  var ws = "\"".writeStream()
  for (var idx = 0; idx < this.length; idx++)
    ws.nextPutAll(escapeChar(this.charAt(idx)))
  ws.nextPutAll("\"")
  return ws.contents()
}

// C-style tempnam function

function tempnam(s) { return (s ? s : "_tmpnam_") + tempnam.n++ }
tempnam.n = 0

// unique tags for objects (useful for making "hash tables")

getTag = (function() {
  var numIdx = 0
  return function(x) {
    if (x === null || x === undefined)
      return x
    switch (typeof x) {
      case "boolean": return x == true ? "Btrue" : "Bfalse"
      case "string":  return "S" + x
      case "number":  return "N" + x
      default:        return x.hasOwnProperty("_id_") ? x._id_ : x._id_ = "R" + numIdx++
    }
  }
})()

/*
  Copyright (c) 2007-2010 Alessandro Warth <awarth@cs.ucla.edu>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

/*
  new syntax:
    #foo and `foo	match the string object 'foo' (it's also accepted in my JS)
    'abc'		match the string object 'abc'
    'c'			match the string object 'c'
    ``abc''		match the sequence of string objects 'a', 'b', 'c'
    "abc"		token('abc')
    [1 2 3]		match the array object [1, 2, 3]
    foo(bar)		apply rule foo with argument bar
    -> ...		semantic actions written in JS (see OMetaParser's atomicHostExpr rule)
*/

/*
ometa M {
  number = number:n digit:d -> { n * 10 + d.digitValue() }
         | digit:d          -> { d.digitValue() }
}

translates to...

M = objectThatDelegatesTo(OMeta, {
  number: function() {
            return this._or(function() {
                              var n = this._apply("number"),
                                  d = this._apply("digit")
                              return n * 10 + d.digitValue()
                            },
                            function() {
                              var d = this._apply("digit")
                              return d.digitValue()
                            }
                           )
          }
})
M.matchAll("123456789", "number")
*/

// the failure exception

fail = { toString: function() { return "match failed" } }

// streams and memoization

function OMInputStream(hd, tl) {
  this.memo = { }
  this.lst  = tl.lst
  this.idx  = tl.idx
  this.hd   = hd
  this.tl   = tl
}
OMInputStream.prototype.head = function() { return this.hd }
OMInputStream.prototype.tail = function() { return this.tl }
OMInputStream.prototype.type = function() { return this.lst.constructor }
OMInputStream.prototype.upTo = function(that) {
  var r = [], curr = this
  while (curr != that) {
    r.push(curr.head())
    curr = curr.tail()
  }
  return this.type() == String ? r.join('') : r
}

function OMInputStreamEnd(lst, idx) {
  this.memo = { }
  this.lst = lst
  this.idx = idx
}
OMInputStreamEnd.prototype = objectThatDelegatesTo(OMInputStream.prototype)
OMInputStreamEnd.prototype.head = function() { throw fail }
OMInputStreamEnd.prototype.tail = function() { throw fail }

// This is necessary b/c in IE, you can't say "foo"[idx]
Array.prototype.at  = function(idx) { return this[idx] }
String.prototype.at = String.prototype.charAt

function ListOMInputStream(lst, idx) {
  this.memo = { }
  this.lst  = lst
  this.idx  = idx
  this.hd   = lst.at(idx)
}
ListOMInputStream.prototype = objectThatDelegatesTo(OMInputStream.prototype)
ListOMInputStream.prototype.head = function() { return this.hd }
ListOMInputStream.prototype.tail = function() { return this.tl || (this.tl = makeListOMInputStream(this.lst, this.idx + 1)) }

function makeListOMInputStream(lst, idx) { return new (idx < lst.length ? ListOMInputStream : OMInputStreamEnd)(lst, idx) }

Array.prototype.toOMInputStream  = function() { return makeListOMInputStream(this, 0) }
String.prototype.toOMInputStream = function() { return makeListOMInputStream(this, 0) }

function makeOMInputStreamProxy(target) {
  return objectThatDelegatesTo(target, {
    memo:   { },
    target: target,
    tail:   function() { return makeOMInputStreamProxy(target.tail()) }
  })
}

// Failer (i.e., that which makes things fail) is used to detect (direct) left recursion and memoize failures

function Failer() { }
Failer.prototype.used = false

// the OMeta "class" and basic functionality

var OMeta = exports.OMeta = {
  _apply: function(rule) {
    var memoRec = this.input.memo[rule]
    if (memoRec == undefined) {
      var origInput = this.input,
          failer    = new Failer()
      if (this[rule] === undefined)
        throw 'tried to apply undefined rule "' + rule + '"'
      this.input.memo[rule] = failer
      this.input.memo[rule] = memoRec = {ans: this[rule].call(this), nextInput: this.input}
      if (failer.used) {
        var sentinel = this.input
        while (true) {
          try {
            this.input = origInput
            var ans = this[rule].call(this)
            if (this.input == sentinel)
              throw fail
            memoRec.ans       = ans
            memoRec.nextInput = this.input
          }
          catch (f) {
            if (f != fail)
              throw f
            break
          }
        }
      }
    }
    else if (memoRec instanceof Failer) {
      memoRec.used = true
      throw fail
    }
    this.input = memoRec.nextInput
    return memoRec.ans
  },

  // note: _applyWithArgs and _superApplyWithArgs are not memoized, so they can't be left-recursive
  _applyWithArgs: function(rule) {
    for (var idx = arguments.length - 1; idx > 0; idx--)
      this._prependInput(arguments[idx])
    return this[rule].call(this)
  },
  _superApplyWithArgs: function(recv, rule) {
    for (var idx = arguments.length - 1; idx > 1; idx--)
      recv._prependInput(arguments[idx])
    return this[rule].call(recv)
  },
  _prependInput: function(v) {
    this.input = new OMInputStream(v, this.input)
  },

  // if you want your grammar (and its subgrammars) to memoize parameterized rules, invoke this method on it:
  memoizeParameterizedRules: function() {
    this._prependInput = function(v) {
      var newInput
      if (isImmutable(v)) {
        newInput = this.input[getTag(v)]
        if (!newInput) {
          newInput = new OMInputStream(v, this.input)
          this.input[getTag(v)] = newInput
        }
      }
      else newInput = new OMInputStream(v, this.input)
      this.input = newInput
    }
    this._applyWithArgs = function(rule) {
      for (var idx = arguments.length - 1; idx > 0; idx--)
        this._prependInput(arguments[idx])
      return this._apply(rule)
    }
  },

  _pred: function(b) {
    if (b)
      return true
    throw fail
  },
  _not: function(x) {
    var origInput = this.input
    try { x.call(this) }
    catch (f) {
      if (f != fail)
        throw f
      this.input = origInput
      return true
    }
    throw fail
  },
  _lookahead: function(x) {
    var origInput = this.input,
        r         = x.call(this)
    this.input = origInput
    return r
  },
  _or: function() {
    var origInput = this.input
    for (var idx = 0; idx < arguments.length; idx++)
      try { this.input = origInput; return arguments[idx].call(this) }
      catch (f) {
        if (f != fail)
          throw f
      }
    throw fail
  },
  _xor: function(ruleName) {
    var origInput = this.input, idx = 1, newInput, ans
    while (idx < arguments.length) {
      try {
        this.input = origInput
        ans = arguments[idx].call(this)
        if (newInput)
          throw 'more than one choice matched by "exclusive-OR" in ' + ruleName
        newInput = this.input
      }
      catch (f) {
        if (f != fail)
          throw f
      }
      idx++
    }
    if (newInput) {
      this.input = newInput
      return ans
    }
    else
      throw fail
  },
  disableXORs: function() {
    this._xor = function(ruleName) {
      var origInput = this.input
      for (var idx = 1; idx < arguments.length; idx++)
        try { this.input = origInput; return arguments[idx].call(this) }
        catch (f) {
          if (f != fail)
            throw f
        }
      throw fail
    }
  },
  _opt: function(x) {
    var origInput = this.input, ans
    try { ans = x.call(this) }
    catch (f) {
      if (f != fail)
        throw f
      this.input = origInput
    }
    return ans
  },
  _many: function(x) {
    var ans = arguments[1] != undefined ? [arguments[1]] : []
    while (true) {
      var origInput = this.input
      try { ans.push(x.call(this)) }
      catch (f) {
        if (f != fail)
          throw f
        this.input = origInput
        break
      }
    }
    return ans
  },
  _many1: function(x) { return this._many(x, x.call(this)) },
  _form: function(x) {
    var v = this._apply("anything")
    if (!isSequenceable(v))
      throw fail
    var origInput = this.input
    this.input = v.toOMInputStream()
    var r = x.call(this)
    this._apply("end")
    this.input = origInput
    return v
  },
  _consumedBy: function(x) {
    var origInput = this.input
    x.call(this)
    return origInput.upTo(this.input)
  },
  _idxConsumedBy: function(x) {
    var origInput = this.input
    x.call(this)
    return {fromIdx: origInput.idx, toIdx: this.input.idx}
  },
  _interleave: function(mode1, part1, mode2, part2 /* ..., moden, partn */) {
    var currInput = this.input, ans = []
    for (var idx = 0; idx < arguments.length; idx += 2)
      ans[idx / 2] = (arguments[idx] == "*" || arguments[idx] == "+") ? [] : undefined
    while (true) {
      var idx = 0, allDone = true
      while (idx < arguments.length) {
        if (arguments[idx] != "0")
          try {
            this.input = currInput
            switch (arguments[idx]) {
              case "*": ans[idx / 2].push(arguments[idx + 1].call(this));                       break
              case "+": ans[idx / 2].push(arguments[idx + 1].call(this)); arguments[idx] = "*"; break
              case "?": ans[idx / 2] =    arguments[idx + 1].call(this);  arguments[idx] = "0"; break
              case "1": ans[idx / 2] =    arguments[idx + 1].call(this);  arguments[idx] = "0"; break
              default:  throw "invalid mode '" + arguments[idx] + "' in OMeta._interleave"
            }
            currInput = this.input
            break
          }
          catch (f) {
            if (f != fail)
              throw f
            // if this (failed) part's mode is "1" or "+", we're not done yet
            allDone = allDone && (arguments[idx] == "*" || arguments[idx] == "?")
          }
        idx += 2
      }
      if (idx == arguments.length) {
        if (allDone)
          return ans
        else
          throw fail
      }
    }
  },
  _currIdx: function() { return this.input.idx },

  // some basic rules
  anything: function() {
    var r = this.input.head()
    this.input = this.input.tail()
    return r
  },
  end: function() {
    return this._not(function() { return this._apply("anything") })
  },
  pos: function() {
    return this.input.idx
  },
  empty: function() { return true },
  apply: function() {
    var r = this._apply("anything")
    return this._apply(r)
  },
  foreign: function() {
    var g   = this._apply("anything"),
        r   = this._apply("anything"),
        gi  = objectThatDelegatesTo(g, {input: makeOMInputStreamProxy(this.input)})
    var ans = gi._apply(r)
    this.input = gi.input.target
    return ans
  },

  //  some useful "derived" rules
  exactly: function() {
    var wanted = this._apply("anything")
    if (wanted === this._apply("anything"))
      return wanted
    throw fail
  },
  "true": function() {
    var r = this._apply("anything")
    this._pred(r === true)
    return r
  },
  "false": function() {
    var r = this._apply("anything")
    this._pred(r === false)
    return r
  },
  "undefined": function() {
    var r = this._apply("anything")
    this._pred(r === undefined)
    return r
  },
  number: function() {
    var r = this._apply("anything")
    this._pred(typeof r === "number")
    return r
  },
  string: function() {
    var r = this._apply("anything")
    this._pred(typeof r === "string")
    return r
  },
  "char": function() {
    var r = this._apply("anything")
    this._pred(typeof r === "string" && r.length == 1)
    return r
  },
  space: function() {
    var r = this._apply("char")
    this._pred(r.charCodeAt(0) <= 32)
    return r
  },
  spaces: function() {
    return this._many(function() { return this._apply("space") })
  },
  digit: function() {
    var r = this._apply("char")
    this._pred(r >= "0" && r <= "9")
    return r
  },
  lower: function() {
    var r = this._apply("char")
    this._pred(r >= "a" && r <= "z")
    return r
  },
  upper: function() {
    var r = this._apply("char")
    this._pred(r >= "A" && r <= "Z")
    return r
  },
  letter: function() {
    return this._or(function() { return this._apply("lower") },
                    function() { return this._apply("upper") })
  },
  letterOrDigit: function() {
    return this._or(function() { return this._apply("letter") },
                    function() { return this._apply("digit")  })
  },
  firstAndRest: function()  {
    var first = this._apply("anything"),
        rest  = this._apply("anything")
     return this._many(function() { return this._apply(rest) }, this._apply(first))
  },
  seq: function() {
    var xs = this._apply("anything")
    for (var idx = 0; idx < xs.length; idx++)
      this._applyWithArgs("exactly", xs.at(idx))
    return xs
  },
  notLast: function() {
    var rule = this._apply("anything"),
        r    = this._apply(rule)
    this._lookahead(function() { return this._apply(rule) })
    return r
  },

  initialize: function() { },
  // match and matchAll are a grammar's "public interface"
  _genericMatch: function(input, rule, args, matchFailed) {
    if (args == undefined)
      args = []
    var realArgs = [rule]
    for (var idx = 0; idx < args.length; idx++)
      realArgs.push(args[idx])
    var m = objectThatDelegatesTo(this, {input: input})
    m.initialize()
    try { return realArgs.length == 1 ? m._apply.call(m, realArgs[0]) : m._applyWithArgs.apply(m, realArgs) }
    catch (f) {
      if (f == fail && matchFailed != undefined) {
        var input = m.input
        if (input.idx != undefined) {
          while (input.tl != undefined && input.tl.idx != undefined)
            input = input.tl
          input.idx--
        }
        return matchFailed(m, input.idx)
      }
      throw f
    }
  },
  match: function(obj, rule, args, matchFailed) {
    return this._genericMatch([obj].toOMInputStream(),    rule, args, matchFailed)
  },
  matchAll: function(listyObj, rule, args, matchFailed) {
    return this._genericMatch(listyObj.toOMInputStream(), rule, args, matchFailed)
  }
}

/*
  Copyright (c) 2007, 2008 Alessandro Warth <awarth@cs.ucla.edu>

  Permission is hereby granted, free of charge, to any person
  obtaining a copy of this software and associated documentation
  files (the "Software"), to deal in the Software without
  restriction, including without limitation the rights to use,
  copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the
  Software is furnished to do so, subject to the following
  conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
  OTHER DEALINGS IN THE SOFTWARE.
*/

var Parser = exports.Parser = objectThatDelegatesTo(OMeta, {
  listOf: function() {
    var rule  = this._apply("anything"),
        delim = this._apply("anything")
    return this._or(function() {
                      var r = this._apply(rule)
                      return this._many(function() {
                                          this._applyWithArgs("token", delim)
                                          return this._apply(rule)
                                        },
                                        r)
                    },
                    function() { return [] })
  },
  token: function() {
    var cs = this._apply("anything")
    this._apply("spaces")
    return this._applyWithArgs("seq", cs)
  }
})

{var BSJSParser=exports.BSJSParser=objectThatDelegatesTo(Parser,{
"fromTo":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return (function(){x=this._apply("anything");y=this._apply("anything");this._applyWithArgs("seq",x);this._many((function(){return (function(){this._not((function(){return this._applyWithArgs("seq",y)}));return this._apply("char")}).call(this)}));return this._applyWithArgs("seq",y)}).call(this)},
"space":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return Parser._superApplyWithArgs(this,'space')}),(function(){return this._applyWithArgs("fromTo","//","\n")}),(function(){return this._applyWithArgs("fromTo","/*","*/")}))},
"nameFirst":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._apply("letter")}),(function(){return (function(){switch(this._apply('anything')){case "$":return "$";case "_":return "_";default: throw fail}}).call(this)}))},
"nameRest":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._apply("nameFirst")}),(function(){return this._apply("digit")}))},
"iName":function(){var $elf=this,_fromIdx=this.input.idx,r;return (function(){r=this._applyWithArgs("firstAndRest","nameFirst","nameRest");return r.join("")}).call(this)},
"isKeyword":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("anything");return this._pred(BSJSParser._isKeyword(x))}).call(this)},
"name":function(){var $elf=this,_fromIdx=this.input.idx,n;return (function(){n=this._apply("iName");this._not((function(){return this._applyWithArgs("isKeyword",n)}));return ["name",((n == "self")?"$elf":n)]}).call(this)},
"keyword":function(){var $elf=this,_fromIdx=this.input.idx,k;return (function(){k=this._apply("iName");this._applyWithArgs("isKeyword",k);return [k,k]}).call(this)},
"hexDigit":function(){var $elf=this,_fromIdx=this.input.idx,x,v;return (function(){x=this._apply("char");v=this["hexDigits"].indexOf(x.toLowerCase());this._pred((v >= (0)));return v}).call(this)},
"hexLit":function(){var $elf=this,_fromIdx=this.input.idx,n,d;return this._or((function(){return (function(){n=this._apply("hexLit");d=this._apply("hexDigit");return ((n * (16)) + d)}).call(this)}),(function(){return this._apply("hexDigit")}))},
"number":function(){var $elf=this,_fromIdx=this.input.idx,n,ws,fs;return this._or((function(){return (function(){switch(this._apply('anything')){case "0":return (function(){this._applyWithArgs("exactly","x");"0x";n=this._apply("hexLit");return ["number",n]}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){ws=this._many1((function(){return this._apply("digit")}));fs=this._or((function(){return (function(){switch(this._apply('anything')){case ".":return this._many1((function(){return this._apply("digit")}));default: throw fail}}).call(this)}),(function(){return (function(){this._apply("empty");return []}).call(this)}));return ["number",parseFloat(((ws.join("") + ".") + fs.join("")))]}).call(this)}))},
"escapeChar":function(){var $elf=this,_fromIdx=this.input.idx,c;return (function(){this._applyWithArgs("exactly","\\");c=this._apply("char");return unescape(("\\" + c))}).call(this)},
"str":function(){var $elf=this,_fromIdx=this.input.idx,cs,cs,cs,n;return this._or((function(){return (function(){switch(this._apply('anything')){case "\"":return this._or((function(){return (function(){switch(this._apply('anything')){case "\"":return (function(){this._applyWithArgs("exactly","\"");"\"\"\"";cs=this._many((function(){return this._or((function(){return this._apply("escapeChar")}),(function(){return (function(){this._not((function(){return (function(){this._applyWithArgs("exactly","\"");this._applyWithArgs("exactly","\"");this._applyWithArgs("exactly","\"");return "\"\"\""}).call(this)}));return this._apply("char")}).call(this)}))}));this._applyWithArgs("exactly","\"");this._applyWithArgs("exactly","\"");this._applyWithArgs("exactly","\"");"\"\"\"";return ["string",cs.join("")]}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){cs=this._many((function(){return this._or((function(){return this._apply("escapeChar")}),(function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\"")}));return this._apply("char")}).call(this)}))}));this._applyWithArgs("exactly","\"");return ["string",cs.join("")]}).call(this)}));case "\'":return (function(){cs=this._many((function(){return this._or((function(){return this._apply("escapeChar")}),(function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\'")}));return this._apply("char")}).call(this)}))}));this._applyWithArgs("exactly","\'");return ["string",cs.join("")]}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){(function(){switch(this._apply('anything')){case "#":return "#";case "`":return "`";default: throw fail}}).call(this);n=this._apply("iName");return ["string",n]}).call(this)}))},
"special":function(){var $elf=this,_fromIdx=this.input.idx,s;return (function(){s=(function(){switch(this._apply('anything')){case "(":return "(";case ")":return ")";case "{":return "{";case "}":return "}";case "[":return "[";case "]":return "]";case ",":return ",";case ";":return ";";case "?":return "?";case ":":return ":";case "!":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "!==";default: throw fail}}).call(this)}),(function(){return "!="}));default: throw fail}}).call(this)}),(function(){return "!"}));case "=":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "===";default: throw fail}}).call(this)}),(function(){return "=="}));default: throw fail}}).call(this)}),(function(){return "="}));case ">":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return ">=";default: throw fail}}).call(this)}),(function(){return ">"}));case "<":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "<=";default: throw fail}}).call(this)}),(function(){return "<"}));case "+":return this._or((function(){return (function(){switch(this._apply('anything')){case "+":return "++";case "=":return "+=";default: throw fail}}).call(this)}),(function(){return "+"}));case "-":return this._or((function(){return (function(){switch(this._apply('anything')){case "-":return "--";case "=":return "-=";default: throw fail}}).call(this)}),(function(){return "-"}));case "*":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "*=";default: throw fail}}).call(this)}),(function(){return "*"}));case "/":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "/=";default: throw fail}}).call(this)}),(function(){return "/"}));case "%":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "%=";default: throw fail}}).call(this)}),(function(){return "%"}));case "&":return (function(){switch(this._apply('anything')){case "&":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "&&=";default: throw fail}}).call(this)}),(function(){return "&&"}));default: throw fail}}).call(this);case "|":return (function(){switch(this._apply('anything')){case "|":return this._or((function(){return (function(){switch(this._apply('anything')){case "=":return "||=";default: throw fail}}).call(this)}),(function(){return "||"}));default: throw fail}}).call(this);case ".":return ".";default: throw fail}}).call(this);return [s,s]}).call(this)},
"tok":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._apply("spaces");return this._or((function(){return this._apply("name")}),(function(){return this._apply("keyword")}),(function(){return this._apply("number")}),(function(){return this._apply("str")}),(function(){return this._apply("rexp")}),(function(){return this._apply("special")}))}).call(this)},
"toks":function(){var $elf=this,_fromIdx=this.input.idx,ts;return (function(){ts=this._many((function(){return this._apply("token")}));this._apply("spaces");this._apply("end");return ts}).call(this)},
"token":function(){var $elf=this,_fromIdx=this.input.idx,tt,t;return (function(){tt=this._apply("anything");t=this._apply("tok");this._pred((t[(0)] == tt));return t[(1)]}).call(this)},
"spacesNoNl":function(){var $elf=this,_fromIdx=this.input.idx;return this._many((function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\n")}));return this._apply("space")}).call(this)}))},
"rexp":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return (function(){this._applyWithArgs("exactly","/");x=this._apply("rexpBody");this._applyWithArgs("exactly","/");y=this._many((function(){return this._apply("rexpFlag")}));return ["rexp",((("/" + x) + "/") + y.join(""))]}).call(this)},
"rexpFlag":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){switch(this._apply('anything')){case "g":return "g";case "i":return "i";case "m":return "m";default: throw fail}}).call(this)},
"rexpBody":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return (function(){x=this._apply("rexpFChar");y=this._many((function(){return this._apply("rexpChar")}));return (x + y.join(""))}).call(this)},
"rexpFChar":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._not((function(){return this._applyWithArgs("exactly","*")}));return this._apply("rexpChar")}).call(this)},
"rexpChar":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\\")}));this._not((function(){return this._applyWithArgs("exactly","/")}));this._not((function(){return this._applyWithArgs("exactly","[")}));return this._apply("rexpNoTerm")}).call(this)}),(function(){return this._apply("escapeChar")}),(function(){return this._apply("rexpClass")}))},
"rexpNoTerm":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._not((function(){return this._applyWithArgs("exactly","\n")}));this._not((function(){return this._applyWithArgs("exactly","\r")}));return this._apply("char")}).call(this)},
"rexpClass":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){this._applyWithArgs("exactly","[");x=this._many((function(){return this._apply("rexpClChar")}));this._applyWithArgs("exactly","]");return (("[" + x.join("")) + "]")}).call(this)},
"rexpClChar":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","]")}));this._not((function(){return this._applyWithArgs("exactly","\\")}));return this._apply("rexpNoTerm")}).call(this)}),(function(){return this._apply("escapeChar")}))},
"expr":function(){var $elf=this,_fromIdx=this.input.idx;return this._apply("commaExpr")},
"commaExpr":function(){var $elf=this,_fromIdx=this.input.idx,e1,e2;return this._or((function(){return (function(){e1=this._apply("commaExpr");this._applyWithArgs("token",",");e2=this._apply("asgnExpr");return ["binop",",",e1,e2]}).call(this)}),(function(){return this._apply("asgnExpr")}))},
"asgnExpr":function(){var $elf=this,_fromIdx=this.input.idx,e,rhs,rhs,rhs,rhs,rhs,rhs,rhs,rhs;return (function(){e=this._apply("condExpr");return this._or((function(){return (function(){this._applyWithArgs("token","=");rhs=this._apply("asgnExpr");return ["set",e,rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","+=");rhs=this._apply("asgnExpr");return ["mset",e,"+",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","-=");rhs=this._apply("asgnExpr");return ["mset",e,"-",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","*=");rhs=this._apply("asgnExpr");return ["mset",e,"*",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","/=");rhs=this._apply("asgnExpr");return ["mset",e,"/",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","%=");rhs=this._apply("asgnExpr");return ["mset",e,"%",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","&&=");rhs=this._apply("asgnExpr");return ["mset",e,"&&",rhs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","||=");rhs=this._apply("asgnExpr");return ["mset",e,"||",rhs]}).call(this)}),(function(){return (function(){this._apply("empty");return e}).call(this)}))}).call(this)},
"condExpr":function(){var $elf=this,_fromIdx=this.input.idx,e,t,f;return (function(){e=this._apply("orExpr");return this._or((function(){return (function(){this._applyWithArgs("token","?");t=this._apply("condExpr");this._applyWithArgs("token",":");f=this._apply("condExpr");return ["condExpr",e,t,f]}).call(this)}),(function(){return (function(){this._apply("empty");return e}).call(this)}))}).call(this)},
"orExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return this._or((function(){return (function(){x=this._apply("orExpr");this._applyWithArgs("token","||");y=this._apply("andExpr");return ["binop","||",x,y]}).call(this)}),(function(){return this._apply("andExpr")}))},
"andExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return this._or((function(){return (function(){x=this._apply("andExpr");this._applyWithArgs("token","&&");y=this._apply("eqExpr");return ["binop","&&",x,y]}).call(this)}),(function(){return this._apply("eqExpr")}))},
"eqExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y,y,y,y;return this._or((function(){return (function(){x=this._apply("eqExpr");return this._or((function(){return (function(){this._applyWithArgs("token","==");y=this._apply("relExpr");return ["binop","==",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","!=");y=this._apply("relExpr");return ["binop","!=",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","===");y=this._apply("relExpr");return ["binop","===",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","!==");y=this._apply("relExpr");return ["binop","!==",x,y]}).call(this)}))}).call(this)}),(function(){return this._apply("relExpr")}))},
"relExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y,y,y,y,y;return this._or((function(){return (function(){x=this._apply("relExpr");return this._or((function(){return (function(){this._applyWithArgs("token",">");y=this._apply("addExpr");return ["binop",">",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token",">=");y=this._apply("addExpr");return ["binop",">=",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","<");y=this._apply("addExpr");return ["binop","<",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","<=");y=this._apply("addExpr");return ["binop","<=",x,y]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","instanceof");y=this._apply("addExpr");return ["binop","instanceof",x,y]}).call(this)}))}).call(this)}),(function(){return this._apply("addExpr")}))},
"addExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y,x,y;return this._or((function(){return (function(){x=this._apply("addExpr");this._applyWithArgs("token","+");y=this._apply("mulExpr");return ["binop","+",x,y]}).call(this)}),(function(){return (function(){x=this._apply("addExpr");this._applyWithArgs("token","-");y=this._apply("mulExpr");return ["binop","-",x,y]}).call(this)}),(function(){return this._apply("mulExpr")}))},
"mulExpr":function(){var $elf=this,_fromIdx=this.input.idx,x,y,x,y,x,y;return this._or((function(){return (function(){x=this._apply("mulExpr");this._applyWithArgs("token","*");y=this._apply("unary");return ["binop","*",x,y]}).call(this)}),(function(){return (function(){x=this._apply("mulExpr");this._applyWithArgs("token","/");y=this._apply("unary");return ["binop","/",x,y]}).call(this)}),(function(){return (function(){x=this._apply("mulExpr");this._applyWithArgs("token","%");y=this._apply("unary");return ["binop","%",x,y]}).call(this)}),(function(){return this._apply("unary")}))},
"unary":function(){var $elf=this,_fromIdx=this.input.idx,p,p,p,p,p,p,p,p;return this._or((function(){return (function(){this._applyWithArgs("token","-");p=this._apply("postfix");return ["unop","-",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","+");p=this._apply("postfix");return ["unop","+",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","++");p=this._apply("postfix");return ["preop","++",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","--");p=this._apply("postfix");return ["preop","--",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","!");p=this._apply("unary");return ["unop","!",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","void");p=this._apply("unary");return ["unop","void",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","delete");p=this._apply("unary");return ["unop","delete",p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","typeof");p=this._apply("unary");return ["unop","typeof",p]}).call(this)}),(function(){return this._apply("postfix")}))},
"postfix":function(){var $elf=this,_fromIdx=this.input.idx,p;return (function(){p=this._apply("primExpr");return this._or((function(){return (function(){this._apply("spacesNoNl");this._applyWithArgs("token","++");return ["postop","++",p]}).call(this)}),(function(){return (function(){this._apply("spacesNoNl");this._applyWithArgs("token","--");return ["postop","--",p]}).call(this)}),(function(){return (function(){this._apply("empty");return p}).call(this)}))}).call(this)},
"primExpr":function(){var $elf=this,_fromIdx=this.input.idx,p,i,m,as,f,as;return this._or((function(){return (function(){p=this._apply("primExpr");return this._or((function(){return (function(){this._applyWithArgs("token","[");i=this._apply("expr");this._applyWithArgs("token","]");return ["getp",i,p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token",".");m=this._applyWithArgs("token","name");this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","asgnExpr",",");this._applyWithArgs("token",")");return ["send",m,p].concat(as)}).call(this)}),(function(){return (function(){this._applyWithArgs("token",".");f=this._applyWithArgs("token","name");return ["getp",["string",f],p]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","asgnExpr",",");this._applyWithArgs("token",")");return ["call",p].concat(as)}).call(this)}))}).call(this)}),(function(){return this._apply("primExprHd")}))},
"primExprHd":function(){var $elf=this,_fromIdx=this.input.idx,e,n,n,s,n,as,x,es;return this._or((function(){return (function(){this._applyWithArgs("token","(");e=this._apply("expr");this._applyWithArgs("token",")");return e}).call(this)}),(function(){return (function(){this._applyWithArgs("token","this");return ["this"]}).call(this)}),(function(){return (function(){n=this._applyWithArgs("token","name");return ["get",n]}).call(this)}),(function(){return (function(){n=this._applyWithArgs("token","number");return ["number",n]}).call(this)}),(function(){return (function(){s=this._applyWithArgs("token","string");return ["string",s]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","function");return this._apply("funcRest")}).call(this)}),(function(){return (function(){this._applyWithArgs("token","new");n=this._applyWithArgs("token","name");this._applyWithArgs("token","(");as=this._applyWithArgs("listOf","asgnExpr",",");this._applyWithArgs("token",")");return ["new",n].concat(as)}).call(this)}),(function(){return (function(){x=this._applyWithArgs("token","rexp");return ["rexp",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","[");es=this._applyWithArgs("listOf","asgnExpr",",");this._applyWithArgs("token","]");return ["arr"].concat(es)}).call(this)}),(function(){return this._apply("json")}))},
"json":function(){var $elf=this,_fromIdx=this.input.idx,bs;return (function(){this._applyWithArgs("token","{");bs=this._applyWithArgs("listOf","jsonBinding",",");this._applyWithArgs("token","}");return ["json"].concat(bs)}).call(this)},
"jsonBinding":function(){var $elf=this,_fromIdx=this.input.idx,n,v;return (function(){n=this._apply("jsonPropName");this._applyWithArgs("token",":");v=this._apply("asgnExpr");return ["binding",n,v]}).call(this)},
"jsonPropName":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._applyWithArgs("token","name")}),(function(){return this._applyWithArgs("token","number")}),(function(){return this._applyWithArgs("token","string")}))},
"formal":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._apply("spaces");return this._applyWithArgs("token","name")}).call(this)},
"funcRest":function(){var $elf=this,_fromIdx=this.input.idx,fs,body;return (function(){this._applyWithArgs("token","(");fs=this._applyWithArgs("listOf","formal",",");this._applyWithArgs("token",")");this._applyWithArgs("token","{");body=this._apply("srcElems");this._applyWithArgs("token","}");return ["func",fs,body]}).call(this)},
"sc":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return (function(){this._apply("spacesNoNl");return this._or((function(){return (function(){switch(this._apply('anything')){case "\n":return "\n";default: throw fail}}).call(this)}),(function(){return this._lookahead((function(){return this._applyWithArgs("exactly","}")}))}),(function(){return this._apply("end")}))}).call(this)}),(function(){return this._applyWithArgs("token",";")}))},
"binding":function(){var $elf=this,_fromIdx=this.input.idx,n,v;return (function(){n=this._applyWithArgs("token","name");v=this._or((function(){return (function(){this._applyWithArgs("token","=");return this._apply("asgnExpr")}).call(this)}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));return [n,v]}).call(this)},
"block":function(){var $elf=this,_fromIdx=this.input.idx,ss;return (function(){this._applyWithArgs("token","{");ss=this._apply("srcElems");this._applyWithArgs("token","}");return ss}).call(this)},
"vars":function(){var $elf=this,_fromIdx=this.input.idx,bs;return (function(){this._applyWithArgs("token","var");bs=this._applyWithArgs("listOf","binding",",");return ["var"].concat(bs)}).call(this)},
"stmt":function(){var $elf=this,_fromIdx=this.input.idx,bs,c,t,f,c,s,s,c,i,c,u,s,b,v,e,s,e,c,cs,cs,cs,e,t,e,c,f,e,x,s,e;return this._or((function(){return this._apply("block")}),(function(){return this._apply("rexp")}),(function(){return (function(){bs=this._apply("vars");this._apply("sc");return bs}).call(this)}),(function(){return (function(){this._applyWithArgs("token","if");this._applyWithArgs("token","(");c=this._apply("expr");this._applyWithArgs("token",")");t=this._apply("stmt");f=this._or((function(){return (function(){this._applyWithArgs("token","else");return this._apply("stmt")}).call(this)}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));return ["if",c,t,f]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","while");this._applyWithArgs("token","(");c=this._apply("expr");this._applyWithArgs("token",")");s=this._apply("stmt");return ["while",c,s]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","do");s=this._apply("stmt");this._applyWithArgs("token","while");this._applyWithArgs("token","(");c=this._apply("expr");this._applyWithArgs("token",")");this._apply("sc");return ["doWhile",s,c]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","for");this._applyWithArgs("token","(");i=this._or((function(){return this._apply("vars")}),(function(){return this._apply("expr")}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));this._applyWithArgs("token",";");c=this._or((function(){return this._apply("expr")}),(function(){return (function(){this._apply("empty");return ["get","true"]}).call(this)}));this._applyWithArgs("token",";");u=this._or((function(){return this._apply("expr")}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));this._applyWithArgs("token",")");s=this._apply("stmt");return ["for",i,c,u,s]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","for");this._applyWithArgs("token","(");v=this._or((function(){return (function(){this._applyWithArgs("token","var");b=this._apply("binding");return ["var",b]}).call(this)}),(function(){return this._apply("expr")}));this._applyWithArgs("token","in");e=this._apply("asgnExpr");this._applyWithArgs("token",")");s=this._apply("stmt");return ["forIn",v,e,s]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","switch");this._applyWithArgs("token","(");e=this._apply("expr");this._applyWithArgs("token",")");this._applyWithArgs("token","{");cs=this._many((function(){return this._or((function(){return (function(){this._applyWithArgs("token","case");c=this._apply("asgnExpr");this._applyWithArgs("token",":");cs=this._apply("srcElems");return ["case",c,cs]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","default");this._applyWithArgs("token",":");cs=this._apply("srcElems");return ["default",cs]}).call(this)}))}));this._applyWithArgs("token","}");return ["switch",e].concat(cs)}).call(this)}),(function(){return (function(){this._applyWithArgs("token","break");this._apply("sc");return ["break"]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","continue");this._apply("sc");return ["continue"]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","throw");this._apply("spacesNoNl");e=this._apply("asgnExpr");this._apply("sc");return ["throw",e]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","try");t=this._apply("block");this._applyWithArgs("token","catch");this._applyWithArgs("token","(");e=this._applyWithArgs("token","name");this._applyWithArgs("token",")");c=this._apply("block");f=this._or((function(){return (function(){this._applyWithArgs("token","finally");return this._apply("block")}).call(this)}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));return ["try",t,e,c,f]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","return");e=this._or((function(){return this._apply("expr")}),(function(){return (function(){this._apply("empty");return ["get","undefined"]}).call(this)}));this._apply("sc");return ["return",e]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","with");this._applyWithArgs("token","(");x=this._apply("expr");this._applyWithArgs("token",")");s=this._apply("stmt");return ["with",x,s]}).call(this)}),(function(){return (function(){e=this._apply("expr");this._apply("sc");return e}).call(this)}),(function(){return (function(){this._applyWithArgs("token",";");return ["get","undefined"]}).call(this)}))},
"srcElem":function(){var $elf=this,_fromIdx=this.input.idx,n,f;return this._or((function(){return (function(){this._applyWithArgs("token","function");n=this._applyWithArgs("token","name");f=this._apply("funcRest");return ["var",[n,f]]}).call(this)}),(function(){return this._apply("stmt")}))},
"srcElems":function(){var $elf=this,_fromIdx=this.input.idx,ss;return (function(){ss=this._many((function(){return this._apply("srcElem")}));return ["begin"].concat(ss)}).call(this)},
"topLevel":function(){var $elf=this,_fromIdx=this.input.idx,r;return (function(){r=this._apply("srcElems");this._apply("spaces");this._apply("end");return r}).call(this)}});(BSJSParser["hexDigits"]="0123456789abcdef");(BSJSParser["keywords"]=({}));(keywords=["break","case","catch","continue","default","delete","do","else","finally","for","function","if","in","instanceof","new","return","switch","this","throw","try","typeof","var","void","while","with","ometa"]);for(var idx = (0);(idx < keywords["length"]);idx++){(BSJSParser["keywords"][keywords[idx]]=true)}(BSJSParser["_isKeyword"]=(function (k){return this["keywords"].hasOwnProperty(k)}));var BSSemActionParser=exports.BSSemActionParser=objectThatDelegatesTo(BSJSParser,{
"curlySemAction":function(){var $elf=this,_fromIdx=this.input.idx,r,s,ss,r,s;return this._or((function(){return (function(){this._applyWithArgs("token","{");r=this._apply("asgnExpr");this._apply("sc");this._applyWithArgs("token","}");this._apply("spaces");return r}).call(this)}),(function(){return (function(){this._applyWithArgs("token","{");ss=this._many((function(){return (function(){s=this._apply("srcElem");this._lookahead((function(){return this._apply("srcElem")}));return s}).call(this)}));s=this._or((function(){return (function(){r=this._apply("asgnExpr");this._apply("sc");return ["return",r]}).call(this)}),(function(){return this._apply("srcElem")}));ss.push(s);this._applyWithArgs("token","}");this._apply("spaces");return ["send","call",["func",[],["begin"].concat(ss)],["this"]]}).call(this)}))},
"semAction":function(){var $elf=this,_fromIdx=this.input.idx,r;return this._or((function(){return this._apply("curlySemAction")}),(function(){return (function(){r=this._apply("primExpr");this._apply("spaces");return r}).call(this)}))}});var BSJSTranslator=exports.BSJSTranslator=objectThatDelegatesTo(OMeta,{
"trans":function(){var $elf=this,_fromIdx=this.input.idx,t,ans;return (function(){this._form((function(){return (function(){t=this._apply("anything");return ans=this._applyWithArgs("apply",t)}).call(this)}));return ans}).call(this)},
"curlyTrans":function(){var $elf=this,_fromIdx=this.input.idx,r,rs,r;return this._or((function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","begin");return r=this._apply("curlyTrans")}).call(this)}));return r}).call(this)}),(function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","begin");return rs=this._many((function(){return this._apply("trans")}))}).call(this)}));return (("{" + rs.join(";")) + "}")}).call(this)}),(function(){return (function(){r=this._apply("trans");return (("{" + r) + "}")}).call(this)}))},
"this":function(){var $elf=this,_fromIdx=this.input.idx;return "this"},
"break":function(){var $elf=this,_fromIdx=this.input.idx;return "break"},
"continue":function(){var $elf=this,_fromIdx=this.input.idx;return "continue"},
"number":function(){var $elf=this,_fromIdx=this.input.idx,n;return (function(){n=this._apply("anything");return (("(" + n) + ")")}).call(this)},
"string":function(){var $elf=this,_fromIdx=this.input.idx,s;return (function(){s=this._apply("anything");return s.toProgramString()}).call(this)},
"rexp":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("anything");return x}).call(this)},
"arr":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("trans")}));return (("[" + xs.join(",")) + "]")}).call(this)},
"unop":function(){var $elf=this,_fromIdx=this.input.idx,op,x;return (function(){op=this._apply("anything");x=this._apply("trans");return (((("(" + op) + " ") + x) + ")")}).call(this)},
"getp":function(){var $elf=this,_fromIdx=this.input.idx,fd,x;return (function(){fd=this._apply("trans");x=this._apply("trans");return (((x + "[") + fd) + "]")}).call(this)},
"get":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("anything");return x}).call(this)},
"set":function(){var $elf=this,_fromIdx=this.input.idx,lhs,rhs;return (function(){lhs=this._apply("trans");rhs=this._apply("trans");return (((("(" + lhs) + "=") + rhs) + ")")}).call(this)},
"mset":function(){var $elf=this,_fromIdx=this.input.idx,lhs,op,rhs;return (function(){lhs=this._apply("trans");op=this._apply("anything");rhs=this._apply("trans");return ((((("(" + lhs) + op) + "=") + rhs) + ")")}).call(this)},
"binop":function(){var $elf=this,_fromIdx=this.input.idx,op,x,y;return (function(){op=this._apply("anything");x=this._apply("trans");y=this._apply("trans");return (((((("(" + x) + " ") + op) + " ") + y) + ")")}).call(this)},
"preop":function(){var $elf=this,_fromIdx=this.input.idx,op,x;return (function(){op=this._apply("anything");x=this._apply("trans");return (op + x)}).call(this)},
"postop":function(){var $elf=this,_fromIdx=this.input.idx,op,x;return (function(){op=this._apply("anything");x=this._apply("trans");return (x + op)}).call(this)},
"return":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ("return " + x)}).call(this)},
"with":function(){var $elf=this,_fromIdx=this.input.idx,x,s;return (function(){x=this._apply("trans");s=this._apply("curlyTrans");return ((("with(" + x) + ")") + s)}).call(this)},
"if":function(){var $elf=this,_fromIdx=this.input.idx,cond,t,e;return (function(){cond=this._apply("trans");t=this._apply("curlyTrans");e=this._apply("curlyTrans");return ((((("if(" + cond) + ")") + t) + "else") + e)}).call(this)},
"condExpr":function(){var $elf=this,_fromIdx=this.input.idx,cond,t,e;return (function(){cond=this._apply("trans");t=this._apply("trans");e=this._apply("trans");return (((((("(" + cond) + "?") + t) + ":") + e) + ")")}).call(this)},
"while":function(){var $elf=this,_fromIdx=this.input.idx,cond,body;return (function(){cond=this._apply("trans");body=this._apply("curlyTrans");return ((("while(" + cond) + ")") + body)}).call(this)},
"doWhile":function(){var $elf=this,_fromIdx=this.input.idx,body,cond;return (function(){body=this._apply("curlyTrans");cond=this._apply("trans");return (((("do" + body) + "while(") + cond) + ")")}).call(this)},
"for":function(){var $elf=this,_fromIdx=this.input.idx,init,cond,upd,body;return (function(){init=this._apply("trans");cond=this._apply("trans");upd=this._apply("trans");body=this._apply("curlyTrans");return ((((((("for(" + init) + ";") + cond) + ";") + upd) + ")") + body)}).call(this)},
"forIn":function(){var $elf=this,_fromIdx=this.input.idx,x,arr,body;return (function(){x=this._apply("trans");arr=this._apply("trans");body=this._apply("curlyTrans");return ((((("for(" + x) + " in ") + arr) + ")") + body)}).call(this)},
"begin":function(){var $elf=this,_fromIdx=this.input.idx,x,x,xs;return this._or((function(){return (function(){x=this._apply("trans");this._apply("end");return x}).call(this)}),(function(){return (function(){xs=this._many((function(){return (function(){x=this._apply("trans");return this._or((function(){return (function(){this._or((function(){return this._pred((x[(x["length"] - (1))] == "}"))}),(function(){return this._apply("end")}));return x}).call(this)}),(function(){return (function(){this._apply("empty");return (x + ";")}).call(this)}))}).call(this)}));return (("{" + xs.join("")) + "}")}).call(this)}))},
"func":function(){var $elf=this,_fromIdx=this.input.idx,args,body;return (function(){args=this._apply("anything");body=this._apply("curlyTrans");return (((("(function (" + args.join(",")) + ")") + body) + ")")}).call(this)},
"call":function(){var $elf=this,_fromIdx=this.input.idx,fn,args;return (function(){fn=this._apply("trans");args=this._many((function(){return this._apply("trans")}));return (((fn + "(") + args.join(",")) + ")")}).call(this)},
"send":function(){var $elf=this,_fromIdx=this.input.idx,msg,recv,args;return (function(){msg=this._apply("anything");recv=this._apply("trans");args=this._many((function(){return this._apply("trans")}));return (((((recv + ".") + msg) + "(") + args.join(",")) + ")")}).call(this)},
"new":function(){var $elf=this,_fromIdx=this.input.idx,cls,args;return (function(){cls=this._apply("anything");args=this._many((function(){return this._apply("trans")}));return (((("new " + cls) + "(") + args.join(",")) + ")")}).call(this)},
"var":function(){var $elf=this,_fromIdx=this.input.idx,n,v,vs;return (function(){vs=this._many1((function(){return (function(){this._form((function(){return (function(){n=this._apply("anything");return v=this._apply("trans")}).call(this)}));return ((n + " = ") + v)}).call(this)}));return ("var " + vs.join(","))}).call(this)},
"throw":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ("throw " + x)}).call(this)},
"try":function(){var $elf=this,_fromIdx=this.input.idx,x,name,c,f;return (function(){x=this._apply("curlyTrans");name=this._apply("anything");c=this._apply("curlyTrans");f=this._apply("curlyTrans");return ((((((("try " + x) + "catch(") + name) + ")") + c) + "finally") + f)}).call(this)},
"json":function(){var $elf=this,_fromIdx=this.input.idx,props;return (function(){props=this._many((function(){return this._apply("trans")}));return (("({" + props.join(",")) + "})")}).call(this)},
"binding":function(){var $elf=this,_fromIdx=this.input.idx,name,val;return (function(){name=this._apply("anything");val=this._apply("trans");return ((name.toProgramString() + ": ") + val)}).call(this)},
"switch":function(){var $elf=this,_fromIdx=this.input.idx,x,cases;return (function(){x=this._apply("trans");cases=this._many((function(){return this._apply("trans")}));return (((("switch(" + x) + "){") + cases.join(";")) + "}")}).call(this)},
"case":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return (function(){x=this._apply("trans");y=this._apply("trans");return ((("case " + x) + ": ") + y)}).call(this)},
"default":function(){var $elf=this,_fromIdx=this.input.idx,y;return (function(){y=this._apply("trans");return ("default: " + y)}).call(this)}})}
{var BSOMetaParser=exports.BSOMetaParser=objectThatDelegatesTo(Parser,{
"fromTo":function(){var $elf=this,_fromIdx=this.input.idx,x,y;return (function(){x=this._apply("anything");y=this._apply("anything");this._applyWithArgs("seq",x);this._many((function(){return (function(){this._not((function(){return this._applyWithArgs("seq",y)}));return this._apply("char")}).call(this)}));return this._applyWithArgs("seq",y)}).call(this)},
"space":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return Parser._superApplyWithArgs(this,'space')}),(function(){return this._applyWithArgs("fromTo","//","\n")}),(function(){return this._applyWithArgs("fromTo","/*","*/")}))},
"nameFirst":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return (function(){switch(this._apply('anything')){case "_":return "_";case "$":return "$";default: throw fail}}).call(this)}),(function(){return this._apply("letter")}))},
"nameRest":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._apply("nameFirst")}),(function(){return this._apply("digit")}))},
"tsName":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._applyWithArgs("firstAndRest","nameFirst","nameRest");return xs.join("")}).call(this)},
"name":function(){var $elf=this,_fromIdx=this.input.idx;return (function(){this._apply("spaces");return this._apply("tsName")}).call(this)},
"eChar":function(){var $elf=this,_fromIdx=this.input.idx,c;return this._or((function(){return (function(){switch(this._apply('anything')){case "\\":return (function(){c=this._apply("char");return unescape(("\\" + c))}).call(this);default: throw fail}}).call(this)}),(function(){return this._apply("char")}))},
"tsString":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){this._applyWithArgs("exactly","\'");xs=this._many((function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\'")}));return this._apply("eChar")}).call(this)}));this._applyWithArgs("exactly","\'");return xs.join("")}).call(this)},
"characters":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){this._applyWithArgs("exactly","`");this._applyWithArgs("exactly","`");xs=this._many((function(){return (function(){this._not((function(){return (function(){this._applyWithArgs("exactly","\'");return this._applyWithArgs("exactly","\'")}).call(this)}));return this._apply("eChar")}).call(this)}));this._applyWithArgs("exactly","\'");this._applyWithArgs("exactly","\'");return ["App","seq",xs.join("").toProgramString()]}).call(this)},
"sCharacters":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){this._applyWithArgs("exactly","\"");xs=this._many((function(){return (function(){this._not((function(){return this._applyWithArgs("exactly","\"")}));return this._apply("eChar")}).call(this)}));this._applyWithArgs("exactly","\"");return ["App","token",xs.join("").toProgramString()]}).call(this)},
"string":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._or((function(){return (function(){(function(){switch(this._apply('anything')){case "#":return "#";case "`":return "`";default: throw fail}}).call(this);return this._apply("tsName")}).call(this)}),(function(){return this._apply("tsString")}));return ["App","exactly",xs.toProgramString()]}).call(this)},
"number":function(){var $elf=this,_fromIdx=this.input.idx,sign,ds;return (function(){sign=this._or((function(){return (function(){switch(this._apply('anything')){case "-":return "-";default: throw fail}}).call(this)}),(function(){return (function(){this._apply("empty");return ""}).call(this)}));ds=this._many1((function(){return this._apply("digit")}));return ["App","exactly",(sign + ds.join(""))]}).call(this)},
"keyword":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._apply("anything");this._applyWithArgs("token",xs);this._not((function(){return this._apply("letterOrDigit")}));return xs}).call(this)},
"args":function(){var $elf=this,_fromIdx=this.input.idx,xs;return this._or((function(){return (function(){switch(this._apply('anything')){case "(":return (function(){xs=this._applyWithArgs("listOf","hostExpr",",");this._applyWithArgs("token",")");return xs}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){this._apply("empty");return []}).call(this)}))},
"application":function(){var $elf=this,_fromIdx=this.input.idx,rule,as,grm,rule,as,rule,as;return this._or((function(){return (function(){this._applyWithArgs("token","^");rule=this._apply("name");as=this._apply("args");return ["App","super",(("\'" + rule) + "\'")].concat(as)}).call(this)}),(function(){return (function(){grm=this._apply("name");this._applyWithArgs("token",".");rule=this._apply("name");as=this._apply("args");return ["App","foreign",grm,(("\'" + rule) + "\'")].concat(as)}).call(this)}),(function(){return (function(){rule=this._apply("name");as=this._apply("args");return ["App",rule].concat(as)}).call(this)}))},
"hostExpr":function(){var $elf=this,_fromIdx=this.input.idx,r;return (function(){r=this._applyWithArgs("foreign",BSSemActionParser,'asgnExpr');return this._applyWithArgs("foreign",BSJSTranslator,'trans',r)}).call(this)},
"curlyHostExpr":function(){var $elf=this,_fromIdx=this.input.idx,r;return (function(){r=this._applyWithArgs("foreign",BSSemActionParser,'curlySemAction');return this._applyWithArgs("foreign",BSJSTranslator,'trans',r)}).call(this)},
"primHostExpr":function(){var $elf=this,_fromIdx=this.input.idx,r;return (function(){r=this._applyWithArgs("foreign",BSSemActionParser,'semAction');return this._applyWithArgs("foreign",BSJSTranslator,'trans',r)}).call(this)},
"atomicHostExpr":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._apply("curlyHostExpr")}),(function(){return this._apply("primHostExpr")}))},
"semAction":function(){var $elf=this,_fromIdx=this.input.idx,x,x;return this._or((function(){return (function(){x=this._apply("curlyHostExpr");return ["Act",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","!");x=this._apply("atomicHostExpr");return ["Act",x]}).call(this)}))},
"arrSemAction":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){this._applyWithArgs("token","->");x=this._apply("atomicHostExpr");return ["Act",x]}).call(this)},
"semPred":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){this._applyWithArgs("token","?");x=this._apply("atomicHostExpr");return ["Pred",x]}).call(this)},
"expr":function(){var $elf=this,_fromIdx=this.input.idx,x,xs,x,xs;return this._or((function(){return (function(){x=this._applyWithArgs("expr5",true);xs=this._many1((function(){return (function(){this._applyWithArgs("token","|");return this._applyWithArgs("expr5",true)}).call(this)}));return ["Or",x].concat(xs)}).call(this)}),(function(){return (function(){x=this._applyWithArgs("expr5",true);xs=this._many1((function(){return (function(){this._applyWithArgs("token","||");return this._applyWithArgs("expr5",true)}).call(this)}));return ["XOr",x].concat(xs)}).call(this)}),(function(){return this._applyWithArgs("expr5",false)}))},
"expr5":function(){var $elf=this,_fromIdx=this.input.idx,ne,x,xs;return (function(){ne=this._apply("anything");return this._or((function(){return (function(){x=this._apply("interleavePart");xs=this._many1((function(){return (function(){this._applyWithArgs("token","&&");return this._apply("interleavePart")}).call(this)}));return ["Interleave",x].concat(xs)}).call(this)}),(function(){return this._applyWithArgs("expr4",ne)}))}).call(this)},
"interleavePart":function(){var $elf=this,_fromIdx=this.input.idx,part,part;return this._or((function(){return (function(){this._applyWithArgs("token","(");part=this._applyWithArgs("expr4",true);this._applyWithArgs("token",")");return ["1",part]}).call(this)}),(function(){return (function(){part=this._applyWithArgs("expr4",true);return this._applyWithArgs("modedIPart",part)}).call(this)}))},
"modedIPart":function(){var $elf=this,_fromIdx=this.input.idx,part,part,part,part;return this._or((function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","And");return this._form((function(){return (function(){this._applyWithArgs("exactly","Many");return part=this._apply("anything")}).call(this)}))}).call(this)}));return ["*",part]}).call(this)}),(function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","And");return this._form((function(){return (function(){this._applyWithArgs("exactly","Many1");return part=this._apply("anything")}).call(this)}))}).call(this)}));return ["+",part]}).call(this)}),(function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","And");return this._form((function(){return (function(){this._applyWithArgs("exactly","Opt");return part=this._apply("anything")}).call(this)}))}).call(this)}));return ["?",part]}).call(this)}),(function(){return (function(){part=this._apply("anything");return ["1",part]}).call(this)}))},
"expr4":function(){var $elf=this,_fromIdx=this.input.idx,ne,xs,act,xs,xs;return (function(){ne=this._apply("anything");return this._or((function(){return (function(){xs=this._many((function(){return this._apply("expr3")}));act=this._apply("arrSemAction");return ["And"].concat(xs).concat([act])}).call(this)}),(function(){return (function(){this._pred(ne);xs=this._many1((function(){return this._apply("expr3")}));return ["And"].concat(xs)}).call(this)}),(function(){return (function(){this._pred((ne == false));xs=this._many((function(){return this._apply("expr3")}));return ["And"].concat(xs)}).call(this)}))}).call(this)},
"optIter":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("anything");return this._or((function(){return (function(){switch(this._apply('anything')){case "*":return ["Many",x];case "+":return ["Many1",x];case "?":return ["Opt",x];default: throw fail}}).call(this)}),(function(){return (function(){this._apply("empty");return x}).call(this)}))}).call(this)},
"optBind":function(){var $elf=this,_fromIdx=this.input.idx,x,n;return (function(){x=this._apply("anything");return this._or((function(){return (function(){switch(this._apply('anything')){case ":":return (function(){n=this._apply("name");return (function (){this["locals"].push(n);return ["Set",n,x]}).call(this)}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){this._apply("empty");return x}).call(this)}))}).call(this)},
"expr3":function(){var $elf=this,_fromIdx=this.input.idx,n,x,e;return this._or((function(){return (function(){this._applyWithArgs("token",":");n=this._apply("name");return (function (){this["locals"].push(n);return ["Set",n,["App","anything"]]}).call(this)}).call(this)}),(function(){return (function(){e=this._or((function(){return (function(){x=this._apply("expr2");return this._applyWithArgs("optIter",x)}).call(this)}),(function(){return this._apply("semAction")}));return this._applyWithArgs("optBind",e)}).call(this)}),(function(){return this._apply("semPred")}))},
"expr2":function(){var $elf=this,_fromIdx=this.input.idx,x,x;return this._or((function(){return (function(){this._applyWithArgs("token","~");x=this._apply("expr2");return ["Not",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","&");x=this._apply("expr1");return ["Lookahead",x]}).call(this)}),(function(){return this._apply("expr1")}))},
"expr1":function(){var $elf=this,_fromIdx=this.input.idx,x,x,x,x,x;return this._or((function(){return this._apply("application")}),(function(){return (function(){x=this._or((function(){return this._applyWithArgs("keyword","undefined")}),(function(){return this._applyWithArgs("keyword","nil")}),(function(){return this._applyWithArgs("keyword","true")}),(function(){return this._applyWithArgs("keyword","false")}));return ["App","exactly",x]}).call(this)}),(function(){return (function(){this._apply("spaces");return this._or((function(){return this._apply("characters")}),(function(){return this._apply("sCharacters")}),(function(){return this._apply("string")}),(function(){return this._apply("number")}))}).call(this)}),(function(){return (function(){this._applyWithArgs("token","[");x=this._apply("expr");this._applyWithArgs("token","]");return ["Form",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","<");x=this._apply("expr");this._applyWithArgs("token",">");return ["ConsBy",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","@<");x=this._apply("expr");this._applyWithArgs("token",">");return ["IdxConsBy",x]}).call(this)}),(function(){return (function(){this._applyWithArgs("token","(");x=this._apply("expr");this._applyWithArgs("token",")");return x}).call(this)}))},
"ruleName":function(){var $elf=this,_fromIdx=this.input.idx;return this._or((function(){return this._apply("name")}),(function(){return (function(){this._apply("spaces");return this._apply("tsString")}).call(this)}))},
"rule":function(){var $elf=this,_fromIdx=this.input.idx,n,x,xs;return (function(){this._lookahead((function(){return n=this._apply("ruleName")}));(this["locals"]=["$elf=this","_fromIdx=this.input.idx"]);x=this._applyWithArgs("rulePart",n);xs=this._many((function(){return (function(){this._applyWithArgs("token",",");return this._applyWithArgs("rulePart",n)}).call(this)}));return ["Rule",n,this["locals"],["Or",x].concat(xs)]}).call(this)},
"rulePart":function(){var $elf=this,_fromIdx=this.input.idx,rn,n,b1,b2;return (function(){rn=this._apply("anything");n=this._apply("ruleName");this._pred((n == rn));b1=this._apply("expr4");return this._or((function(){return (function(){this._applyWithArgs("token","=");b2=this._apply("expr");return ["And",b1,b2]}).call(this)}),(function(){return (function(){this._apply("empty");return b1}).call(this)}))}).call(this)},
"grammar":function(){var $elf=this,_fromIdx=this.input.idx,n,sn,rs;return (function(){this._applyWithArgs("keyword","ometa");n=this._apply("name");sn=this._or((function(){return (function(){this._applyWithArgs("token","<:");return this._apply("name")}).call(this)}),(function(){return (function(){this._apply("empty");return "OMeta"}).call(this)}));this._applyWithArgs("token","{");rs=this._applyWithArgs("listOf","rule",",");this._applyWithArgs("token","}");return this._applyWithArgs("foreign",BSOMetaOptimizer,'optimizeGrammar',["Grammar",n,sn].concat(rs))}).call(this)}});var BSOMetaTranslator=exports.BSOMetaTranslator=objectThatDelegatesTo(OMeta,{
"App":function(){var $elf=this,_fromIdx=this.input.idx,args,rule,args,rule;return this._or((function(){return (function(){switch(this._apply('anything')){case "super":return (function(){args=this._many1((function(){return this._apply("anything")}));return [this["sName"],"._superApplyWithArgs(this,",args.join(","),")"].join("")}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){rule=this._apply("anything");args=this._many1((function(){return this._apply("anything")}));return ["this._applyWithArgs(\"",rule,"\",",args.join(","),")"].join("")}).call(this)}),(function(){return (function(){rule=this._apply("anything");return ["this._apply(\"",rule,"\")"].join("")}).call(this)}))},
"Act":function(){var $elf=this,_fromIdx=this.input.idx,expr;return (function(){expr=this._apply("anything");return expr}).call(this)},
"Pred":function(){var $elf=this,_fromIdx=this.input.idx,expr;return (function(){expr=this._apply("anything");return ["this._pred(",expr,")"].join("")}).call(this)},
"Or":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("transFn")}));return ["this._or(",xs.join(","),")"].join("")}).call(this)},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("transFn")}));xs.unshift(((this["name"] + ".") + this["rName"]).toProgramString());return ["this._xor(",xs.join(","),")"].join("")}).call(this)},
"And":function(){var $elf=this,_fromIdx=this.input.idx,xs,y;return this._or((function(){return (function(){xs=this._many((function(){return this._applyWithArgs("notLast","trans")}));y=this._apply("trans");xs.push(("return " + y));return ["(function(){",xs.join(";"),"}).call(this)"].join("")}).call(this)}),(function(){return "undefined"}))},
"Opt":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._opt(",x,")"].join("")}).call(this)},
"Many":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._many(",x,")"].join("")}).call(this)},
"Many1":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._many1(",x,")"].join("")}).call(this)},
"Set":function(){var $elf=this,_fromIdx=this.input.idx,n,v;return (function(){n=this._apply("anything");v=this._apply("trans");return [n,"=",v].join("")}).call(this)},
"Not":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._not(",x,")"].join("")}).call(this)},
"Lookahead":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._lookahead(",x,")"].join("")}).call(this)},
"Form":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._form(",x,")"].join("")}).call(this)},
"ConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._consumedBy(",x,")"].join("")}).call(this)},
"IdxConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("transFn");return ["this._idxConsumedBy(",x,")"].join("")}).call(this)},
"JumpTable":function(){var $elf=this,_fromIdx=this.input.idx,cases;return (function(){cases=this._many((function(){return this._apply("jtCase")}));return this.jumpTableCode(cases)}).call(this)},
"Interleave":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("intPart")}));return ["this._interleave(",xs.join(","),")"].join("")}).call(this)},
"Rule":function(){var $elf=this,_fromIdx=this.input.idx,name,ls,body;return (function(){name=this._apply("anything");(this["rName"]=name);ls=this._apply("locals");body=this._apply("trans");return ["\n\"",name,"\":function(){",ls,"return ",body,"}"].join("")}).call(this)},
"Grammar":function(){var $elf=this,_fromIdx=this.input.idx,name,sName,rules;return (function(){name=this._apply("anything");sName=this._apply("anything");(this["name"]=name);(this["sName"]=sName);rules=this._many((function(){return this._apply("trans")}));return ["var ",name,"=exports.",name,"=objectThatDelegatesTo(",sName,",{",rules.join(","),"})"].join("")}).call(this)},
"intPart":function(){var $elf=this,_fromIdx=this.input.idx,mode,part;return (function(){this._form((function(){return (function(){mode=this._apply("anything");return part=this._apply("transFn")}).call(this)}));return ((mode.toProgramString() + ",") + part)}).call(this)},
"jtCase":function(){var $elf=this,_fromIdx=this.input.idx,x,e;return (function(){this._form((function(){return (function(){x=this._apply("anything");return e=this._apply("trans")}).call(this)}));return [x.toProgramString(),e]}).call(this)},
"locals":function(){var $elf=this,_fromIdx=this.input.idx,vs;return this._or((function(){return (function(){this._form((function(){return vs=this._many1((function(){return this._apply("string")}))}));return ["var ",vs.join(","),";"].join("")}).call(this)}),(function(){return (function(){this._form((function(){return undefined}));return ""}).call(this)}))},
"trans":function(){var $elf=this,_fromIdx=this.input.idx,t,ans;return (function(){this._form((function(){return (function(){t=this._apply("anything");return ans=this._applyWithArgs("apply",t)}).call(this)}));return ans}).call(this)},
"transFn":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["(function(){return ",x,"})"].join("")}).call(this)}});(BSOMetaTranslator["jumpTableCode"]=(function (cases){var buf = new StringBuffer();buf.nextPutAll("(function(){switch(this._apply(\'anything\')){");for(var i = (0);(i < cases["length"]);(i+=(1))){buf.nextPutAll((((("case " + cases[i][(0)]) + ":return ") + cases[i][(1)]) + ";"))};buf.nextPutAll("default: throw fail}}).call(this)");return buf.contents()}))}
{var BSNullOptimization=exports.BSNullOptimization=objectThatDelegatesTo(OMeta,{
"setHelped":function(){var $elf=this,_fromIdx=this.input.idx;return (this["_didSomething"]=true)},
"helped":function(){var $elf=this,_fromIdx=this.input.idx;return this._pred(this["_didSomething"])},
"trans":function(){var $elf=this,_fromIdx=this.input.idx,t,ans;return (function(){this._form((function(){return (function(){t=this._apply("anything");this._pred((this[t] != undefined));return ans=this._applyWithArgs("apply",t)}).call(this)}));return ans}).call(this)},
"optimize":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");this._apply("helped");return x}).call(this)},
"App":function(){var $elf=this,_fromIdx=this.input.idx,rule,args;return (function(){rule=this._apply("anything");args=this._many((function(){return this._apply("anything")}));return ["App",rule].concat(args)}).call(this)},
"Act":function(){var $elf=this,_fromIdx=this.input.idx,expr;return (function(){expr=this._apply("anything");return ["Act",expr]}).call(this)},
"Pred":function(){var $elf=this,_fromIdx=this.input.idx,expr;return (function(){expr=this._apply("anything");return ["Pred",expr]}).call(this)},
"Or":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("trans")}));return ["Or"].concat(xs)}).call(this)},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("trans")}));return ["XOr"].concat(xs)}).call(this)},
"And":function(){var $elf=this,_fromIdx=this.input.idx,xs;return (function(){xs=this._many((function(){return this._apply("trans")}));return ["And"].concat(xs)}).call(this)},
"Opt":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Opt",x]}).call(this)},
"Many":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Many",x]}).call(this)},
"Many1":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Many1",x]}).call(this)},
"Set":function(){var $elf=this,_fromIdx=this.input.idx,n,v;return (function(){n=this._apply("anything");v=this._apply("trans");return ["Set",n,v]}).call(this)},
"Not":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Not",x]}).call(this)},
"Lookahead":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Lookahead",x]}).call(this)},
"Form":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["Form",x]}).call(this)},
"ConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["ConsBy",x]}).call(this)},
"IdxConsBy":function(){var $elf=this,_fromIdx=this.input.idx,x;return (function(){x=this._apply("trans");return ["IdxConsBy",x]}).call(this)},
"JumpTable":function(){var $elf=this,_fromIdx=this.input.idx,c,e,ces;return (function(){ces=this._many((function(){return (function(){this._form((function(){return (function(){c=this._apply("anything");return e=this._apply("trans")}).call(this)}));return [c,e]}).call(this)}));return ["JumpTable"].concat(ces)}).call(this)},
"Interleave":function(){var $elf=this,_fromIdx=this.input.idx,m,p,xs;return (function(){xs=this._many((function(){return (function(){this._form((function(){return (function(){m=this._apply("anything");return p=this._apply("trans")}).call(this)}));return [m,p]}).call(this)}));return ["Interleave"].concat(xs)}).call(this)},
"Rule":function(){var $elf=this,_fromIdx=this.input.idx,name,ls,body;return (function(){name=this._apply("anything");ls=this._apply("anything");body=this._apply("trans");return ["Rule",name,ls,body]}).call(this)}});(BSNullOptimization["initialize"]=(function (){(this["_didSomething"]=false)}));var BSAssociativeOptimization=exports.BSAssociativeOptimization=objectThatDelegatesTo(BSNullOptimization,{
"And":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){return (function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}).call(this)}),(function(){return (function(){xs=this._applyWithArgs("transInside","And");return ["And"].concat(xs)}).call(this)}))},
"Or":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){return (function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}).call(this)}),(function(){return (function(){xs=this._applyWithArgs("transInside","Or");return ["Or"].concat(xs)}).call(this)}))},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,x,xs;return this._or((function(){return (function(){x=this._apply("trans");this._apply("end");this._apply("setHelped");return x}).call(this)}),(function(){return (function(){xs=this._applyWithArgs("transInside","XOr");return ["XOr"].concat(xs)}).call(this)}))},
"transInside":function(){var $elf=this,_fromIdx=this.input.idx,t,xs,ys,x,xs;return (function(){t=this._apply("anything");return this._or((function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly",t);return xs=this._applyWithArgs("transInside",t)}).call(this)}));ys=this._applyWithArgs("transInside",t);this._apply("setHelped");return xs.concat(ys)}).call(this)}),(function(){return (function(){x=this._apply("trans");xs=this._applyWithArgs("transInside",t);return [x].concat(xs)}).call(this)}),(function(){return []}))}).call(this)}});var BSSeqInliner=exports.BSSeqInliner=objectThatDelegatesTo(BSNullOptimization,{
"App":function(){var $elf=this,_fromIdx=this.input.idx,s,cs,rule,args;return this._or((function(){return (function(){switch(this._apply('anything')){case "seq":return (function(){s=this._apply("anything");this._apply("end");cs=this._applyWithArgs("seqString",s);this._apply("setHelped");return ["And"].concat(cs).concat([["Act",s]])}).call(this);default: throw fail}}).call(this)}),(function(){return (function(){rule=this._apply("anything");args=this._many((function(){return this._apply("anything")}));return ["App",rule].concat(args)}).call(this)}))},
"inlineChar":function(){var $elf=this,_fromIdx=this.input.idx,c;return (function(){c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return ["App","exactly",c.toProgramString()]}).call(this)},
"seqString":function(){var $elf=this,_fromIdx=this.input.idx,s,cs,cs;return (function(){this._lookahead((function(){return (function(){s=this._apply("anything");return this._pred(((typeof s) === "string"))}).call(this)}));return this._or((function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","\"");cs=this._many((function(){return this._apply("inlineChar")}));return this._applyWithArgs("exactly","\"")}).call(this)}));return cs}).call(this)}),(function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","\'");cs=this._many((function(){return this._apply("inlineChar")}));return this._applyWithArgs("exactly","\'")}).call(this)}));return cs}).call(this)}))}).call(this)}});(JumpTable=(function (choiceOp,choice){(this["choiceOp"]=choiceOp);(this["choices"]=({}));this.add(choice)}));(JumpTable["prototype"]["add"]=(function (choice){var c = choice[(0)],t = choice[(1)];if(this["choices"][c]){if((this["choices"][c][(0)] == this["choiceOp"])){this["choices"][c].push(t)}else{(this["choices"][c]=[this["choiceOp"],this["choices"][c],t])}}else{(this["choices"][c]=t)}}));(JumpTable["prototype"]["toTree"]=(function (){var r = ["JumpTable"],choiceKeys = ownPropertyNames(this["choices"]);for(var i = (0);(i < choiceKeys["length"]);(i+=(1))){r.push([choiceKeys[i],this["choices"][choiceKeys[i]]])};return r}));var BSJumpTableOptimization=exports.BSJumpTableOptimization=objectThatDelegatesTo(BSNullOptimization,{
"Or":function(){var $elf=this,_fromIdx=this.input.idx,cs;return (function(){cs=this._many((function(){return this._or((function(){return this._applyWithArgs("jtChoices","Or")}),(function(){return this._apply("trans")}))}));return ["Or"].concat(cs)}).call(this)},
"XOr":function(){var $elf=this,_fromIdx=this.input.idx,cs;return (function(){cs=this._many((function(){return this._or((function(){return this._applyWithArgs("jtChoices","XOr")}),(function(){return this._apply("trans")}))}));return ["XOr"].concat(cs)}).call(this)},
"quotedString":function(){var $elf=this,_fromIdx=this.input.idx,c,cs,c,cs;return (function(){this._lookahead((function(){return this._apply("string")}));this._form((function(){return (function(){switch(this._apply('anything')){case "\"":return (function(){cs=this._many((function(){return (function(){c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return c}).call(this)}));return this._applyWithArgs("exactly","\"")}).call(this);case "\'":return (function(){cs=this._many((function(){return (function(){c=this._applyWithArgs("foreign",BSOMetaParser,'eChar');this._not((function(){return this._apply("end")}));return c}).call(this)}));return this._applyWithArgs("exactly","\'")}).call(this);default: throw fail}}).call(this)}));return cs.join("")}).call(this)},
"jtChoice":function(){var $elf=this,_fromIdx=this.input.idx,x,rest,x;return this._or((function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","And");this._form((function(){return (function(){this._applyWithArgs("exactly","App");this._applyWithArgs("exactly","exactly");return x=this._apply("quotedString")}).call(this)}));return rest=this._many((function(){return this._apply("anything")}))}).call(this)}));return [x,["And"].concat(rest)]}).call(this)}),(function(){return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","App");this._applyWithArgs("exactly","exactly");return x=this._apply("quotedString")}).call(this)}));return [x,["Act",x.toProgramString()]]}).call(this)}))},
"jtChoices":function(){var $elf=this,_fromIdx=this.input.idx,op,c,jt,c;return (function(){op=this._apply("anything");c=this._apply("jtChoice");jt=new JumpTable(op,c);this._many((function(){return (function(){c=this._apply("jtChoice");return jt.add(c)}).call(this)}));this._apply("setHelped");return jt.toTree()}).call(this)}});var BSOMetaOptimizer=exports.BSOMetaOptimizer=objectThatDelegatesTo(OMeta,{
"optimizeGrammar":function(){var $elf=this,_fromIdx=this.input.idx,n,sn,rs;return (function(){this._form((function(){return (function(){this._applyWithArgs("exactly","Grammar");n=this._apply("anything");sn=this._apply("anything");return rs=this._many((function(){return this._apply("optimizeRule")}))}).call(this)}));return ["Grammar",n,sn].concat(rs)}).call(this)},
"optimizeRule":function(){var $elf=this,_fromIdx=this.input.idx,r,r,r,r;return (function(){r=this._apply("anything");this._or((function(){return r=this._applyWithArgs("foreign",BSSeqInliner,'optimize',r)}),(function(){return this._apply("empty")}));this._many((function(){return this._or((function(){return r=this._applyWithArgs("foreign",BSAssociativeOptimization,'optimize',r)}),(function(){return r=this._applyWithArgs("foreign",BSJumpTableOptimization,'optimize',r)}))}));return r}).call(this)}})}
{var BSOMetaJSParser=exports.BSOMetaJSParser=objectThatDelegatesTo(BSJSParser,{
"srcElem":function(){var $elf=this,_fromIdx=this.input.idx,r;return this._or((function(){return (function(){this._apply("spaces");r=this._applyWithArgs("foreign",BSOMetaParser,'grammar');this._apply("sc");return r}).call(this)}),(function(){return BSJSParser._superApplyWithArgs(this,'srcElem')}))}});var BSOMetaJSTranslator=exports.BSOMetaJSTranslator=objectThatDelegatesTo(BSJSTranslator,{
"Grammar":function(){var $elf=this,_fromIdx=this.input.idx;return this._applyWithArgs("foreign",BSOMetaTranslator,'Grammar')}})}
var translateCode = exports.translateCode = function (code) {
  var fail = { toString: function(){ return "match failed" } },
      translationError = function(m, i) { throw fail },
      tree = BSOMetaJSParser.matchAll(code, "topLevel", undefined, function (m, i) { throw objectThatDelegatesTo(fail, {errorPos: i}) });
  return BSOMetaJSTranslator.match(tree, "trans", undefined, translationError);
};

var evalCode = exports.evalCode = function (code) { return eval(translateCode(code)) };
