var ometajs_ = require("ometajs");

var AbstractGrammar = ometajs_.grammars.AbstractGrammar;

var BSJSParser = ometajs_.grammars.BSJSParser;

var BSJSIdentity = ometajs_.grammars.BSJSIdentity;

var BSJSTranslator = ometajs_.grammars.BSJSTranslator;

var BSJSParser = function BSJSParser(source) {
    AbstractGrammar.call(this, source);
};

BSJSParser.match = AbstractGrammar.match;

BSJSParser.matchAll = AbstractGrammar.matchAll;

exports.BSJSParser = BSJSParser;

require("util").inherits(BSJSParser, AbstractGrammar);

BSJSParser.prototype["space"] = function $space() {
    return this._atomic(function() {
        return this._rule("space", true, [], AbstractGrammar);
    }) || this._atomic(function() {
        return this._list(function() {
            return this._atomic(function() {
                return this._match("/") && this._match("/");
            }) && this._any(function() {
                return this._atomic(function() {
                    return !this._match("\n");
                }, true) && this._rule("char", false, [], null);
            });
        }, true);
    }) || this._atomic(function() {
        return this._rule("fromTo", true, [ "/*", "*/" ], null);
    });
};

BSJSParser.prototype["nameFirst"] = function $nameFirst() {
    return this._atomic(function() {
        return this._rule("letter", true, [], null);
    }) || this._match("$") || this._match("_");
};

BSJSParser.prototype["nameRest"] = function $nameRest() {
    return this._atomic(function() {
        return this._rule("nameFirst", true, [], null);
    }) || this._atomic(function() {
        return this._rule("digit", true, [], null);
    });
};

BSJSParser.prototype["iName"] = function $iName() {
    return this._list(function() {
        return this._rule("nameFirst", true, [], null) && this._any(function() {
            return this._rule("nameRest", true, [], null);
        });
    }, true);
};

BSJSParser.prototype["isKeyword"] = function $isKeyword() {
    var x;
    return this._skip() && (x = this._getIntermediate(), true) && BSJSParser._isKeyword(x);
};

BSJSParser.prototype["name"] = function $name() {
    var n;
    return this._rule("iName", true, [], null) && (n = this._getIntermediate(), true) && this._atomic(function() {
        return !this._rule("isKeyword", false, [ n ], null);
    }, true) && this._exec([ "name", n == "self" ? "$elf" : n ]);
};

BSJSParser.prototype["keyword"] = function $keyword() {
    var k;
    return this._rule("iName", true, [], null) && (k = this._getIntermediate(), true) && this._rule("isKeyword", false, [ k ], null) && this._exec([ k, k ]);
};

BSJSParser.prototype["hexDigit"] = function $hexDigit() {
    var x, v;
    return this._rule("char", true, [], null) && (x = this._getIntermediate(), true) && this._exec(BSJSParser.hexDigits.indexOf(x.toLowerCase())) && (v = this._getIntermediate(), true) && v >= 0 && this._exec(v);
};

BSJSParser.prototype["hexLit"] = function $hexLit() {
    return this._atomic(function() {
        var n, d;
        return this._rule("hexLit", false, [], null) && (n = this._getIntermediate(), true) && this._rule("hexDigit", false, [], null) && (d = this._getIntermediate(), true) && this._exec(n * 16 + d);
    }) || this._atomic(function() {
        return this._rule("hexDigit", false, [], null);
    });
};

BSJSParser.prototype["number"] = function $number() {
    return this._atomic(function() {
        var n;
        return this._atomic(function() {
            return this._match("0") && this._match("x");
        }) && this._rule("hexLit", false, [], null) && (n = this._getIntermediate(), true) && this._exec([ "number", n ]);
    }) || this._atomic(function() {
        var f;
        return this._list(function() {
            return this._many(function() {
                return this._rule("digit", false, [], null);
            }) && this._optional(function() {
                return (this._match(".") || this._atomic(function() {
                    return (this._match("e") || this._match("E")) && this._optional(function() {
                        return this._match("-") || this._match("+");
                    });
                })) && this._many(function() {
                    return this._rule("digit", false, [], null);
                });
            });
        }, true) && (f = this._getIntermediate(), true) && this._exec([ "number", parseFloat(f) ]);
    });
};

BSJSParser.prototype["escapeChar"] = function $escapeChar() {
    return this._atomic(function() {
        var s;
        return this._list(function() {
            return this._match("\\") && this._rule("char", false, [], null);
        }, true) && (s = this._getIntermediate(), true) && this._exec(function() {
            switch (s) {
              case '\\"':
                return '"';
              case "\\'":
                return "'";
              case "\\n":
                return "\n";
              case "\\r":
                return "\r";
              case "\\t":
                return "\t";
              case "\\b":
                return "\b";
              case "\\f":
                return "\f";
              case "\\\\":
                return "\\";
              default:
                return s.charAt(1);
            }
        }.call(this));
    }) || this._atomic(function() {
        var s;
        return this._list(function() {
            return this._match("\\") && (this._atomic(function() {
                return this._match("u") && this._rule("hexDigit", false, [], null) && this._rule("hexDigit", false, [], null) && this._rule("hexDigit", false, [], null) && this._rule("hexDigit", false, [], null);
            }) || this._atomic(function() {
                return this._match("x") && this._rule("hexDigit", false, [], null) && this._rule("hexDigit", false, [], null);
            }));
        }, true) && (s = this._getIntermediate(), true) && this._exec(function() {
            return JSON.parse('"' + s + '"');
        }.call(this));
    });
};

BSJSParser.prototype["str"] = function $str() {
    return this._atomic(function() {
        var cs;
        return this._rule("seq", false, [ '"""' ], null) && this._any(function() {
            return this._atomic(function() {
                return this._rule("escapeChar", false, [], null);
            }) || this._atomic(function() {
                return this._atomic(function() {
                    return !this._rule("seq", false, [ '"""' ], null);
                }, true) && this._rule("char", false, [], null);
            });
        }) && (cs = this._getIntermediate(), true) && this._rule("seq", false, [ '"""' ], null) && this._exec([ "string", cs.join("") ]);
    }) || this._atomic(function() {
        var cs;
        return this._match("'") && this._any(function() {
            return this._atomic(function() {
                return this._rule("escapeChar", false, [], null);
            }) || this._atomic(function() {
                return this._atomic(function() {
                    return !this._match("'");
                }, true) && this._rule("char", false, [], null);
            });
        }) && (cs = this._getIntermediate(), true) && this._match("'") && this._exec([ "string", cs.join("") ]);
    }) || this._atomic(function() {
        var cs;
        return this._match('"') && this._any(function() {
            return this._atomic(function() {
                return this._rule("escapeChar", false, [], null);
            }) || this._atomic(function() {
                return this._atomic(function() {
                    return !this._match('"');
                }, true) && this._rule("char", false, [], null);
            });
        }) && (cs = this._getIntermediate(), true) && this._match('"') && this._exec([ "string", cs.join("") ]);
    }) || this._atomic(function() {
        var n;
        return (this._match("#") || this._match("`")) && this._rule("iName", false, [], null) && (n = this._getIntermediate(), true) && this._exec([ "string", n ]);
    });
};

BSJSParser.prototype["special"] = function $special() {
    var s;
    return (this._match("(") || this._match(")") || this._match("{") || this._match("}") || this._match("[") || this._match("]") || this._match(",") || this._match(";") || this._match("?") || this._match(":") || this._atomic(function() {
        return this._match("!") && this._match("=") && this._match("=");
    }) || this._atomic(function() {
        return this._match("!") && this._match("=");
    }) || this._atomic(function() {
        return this._match("=") && this._match("=") && this._match("=");
    }) || this._atomic(function() {
        return this._match("=") && this._match("=");
    }) || this._atomic(function() {
        return this._match("=");
    }) || this._atomic(function() {
        return this._match(">") && this._match("=");
    }) || this._match(">") || this._atomic(function() {
        return this._match("<") && this._match("=");
    }) || this._match("<") || this._atomic(function() {
        return this._match("+") && this._match("+");
    }) || this._atomic(function() {
        return this._match("+") && this._match("=");
    }) || this._match("+") || this._atomic(function() {
        return this._match("-") && this._match("-");
    }) || this._atomic(function() {
        return this._match("-") && this._match("=");
    }) || this._match("-") || this._atomic(function() {
        return this._match("*") && this._match("=");
    }) || this._match("*") || this._atomic(function() {
        return this._match("/") && this._match("=");
    }) || this._match("/") || this._atomic(function() {
        return this._match("%") && this._match("=");
    }) || this._match("%") || this._atomic(function() {
        return this._match("&") && this._match("&") && this._match("=");
    }) || this._atomic(function() {
        return this._match("&") && this._match("&");
    }) || this._atomic(function() {
        return this._match("|") && this._match("|") && this._match("=");
    }) || this._atomic(function() {
        return this._match("|") && this._match("|");
    }) || this._atomic(function() {
        return this._match(">") && this._match(">") && this._match(">");
    }) || this._atomic(function() {
        return this._match("<") && this._match("<") && this._match("<");
    }) || this._atomic(function() {
        return this._match(">") && this._match(">");
    }) || this._atomic(function() {
        return this._match("&") && this._match("=");
    }) || this._atomic(function() {
        return this._match("|") && this._match("=");
    }) || this._atomic(function() {
        return this._match("^") && this._match("=");
    }) || this._match("&") || this._match("|") || this._match("^") || this._match("~") || this._match(".") || this._match("!")) && (s = this._getIntermediate(), true) && this._exec([ s, s ]);
};

BSJSParser.prototype["token"] = function $token() {
    return this._rule("spaces", true, [], null) && (this._atomic(function() {
        return this._rule("name", true, [], null);
    }) || this._atomic(function() {
        return this._rule("keyword", true, [], null);
    }) || this._atomic(function() {
        return this._rule("number", true, [], null);
    }) || this._atomic(function() {
        return this._rule("str", true, [], null);
    }) || this._atomic(function() {
        return this._rule("special", true, [], null);
    }));
};

BSJSParser.prototype["toks"] = function $toks() {
    var ts;
    return this._any(function() {
        return this._rule("token", true, [], null);
    }) && (ts = this._getIntermediate(), true) && this._rule("spaces", true, [], null) && this._rule("end", false, [], null) && this._exec(ts);
};

BSJSParser.prototype["spacesNoNl"] = function $spacesNoNl() {
    return this._any(function() {
        return this._atomic(function() {
            return !this._match("\n");
        }, true) && this._rule("space", false, [], null);
    });
};

BSJSParser.prototype["expr"] = function $expr() {
    return this._rule("commaExpr", false, [], null);
};

BSJSParser.prototype["commaExpr"] = function $commaExpr() {
    return this._atomic(function() {
        var e1, e2;
        return this._rule("commaExpr", false, [], null) && (e1 = this._getIntermediate(), true) && this._rule("token", true, [ "," ], null) && this._rule("asgnExpr", false, [], null) && (e2 = this._getIntermediate(), true) && this._exec([ "binop", ",", e1, e2 ]);
    }) || this._atomic(function() {
        return this._rule("asgnExpr", false, [], null);
    });
};

BSJSParser.prototype["asgnExpr"] = function $asgnExpr() {
    var e;
    return this._rule("condExpr", false, [], null) && (e = this._getIntermediate(), true) && (this._atomic(function() {
        var rhs;
        return this._rule("token", true, [ "=" ], null) && this._rule("asgnExpr", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec([ "set", e, rhs ]);
    }) || this._atomic(function() {
        var op, rhs;
        return (this._atomic(function() {
            return this._rule("token", true, [ "+=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "-=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "*=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "/=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "&&=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "||=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "%=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "<<=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ ">>=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ ">>>=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "&=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "^=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "|=" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("asgnExpr", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec([ "mset", e, op.slice(0, -1), rhs ]);
    }) || this._atomic(function() {
        return this._rule("empty", false, [], null) && this._exec(e);
    }));
};

BSJSParser.prototype["condExpr"] = function $condExpr() {
    var e;
    return this._rule("orExpr", false, [], null) && (e = this._getIntermediate(), true) && (this._atomic(function() {
        var t, f;
        return this._rule("token", true, [ "?" ], null) && this._rule("condExpr", false, [], null) && (t = this._getIntermediate(), true) && this._rule("token", true, [ ":" ], null) && this._rule("condExpr", false, [], null) && (f = this._getIntermediate(), true) && this._exec([ "condExpr", e, t, f ]);
    }) || this._atomic(function() {
        return this._rule("empty", false, [], null) && this._exec(e);
    }));
};

BSJSParser.prototype["orExpr"] = function $orExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("orExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "||" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "&&" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("bitExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("bitExpr", false, [], null);
    });
};

BSJSParser.prototype["bitExpr"] = function $bitExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("bitExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "|" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "^" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "&" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("eqExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("eqExpr", false, [], null);
    });
};

BSJSParser.prototype["eqExpr"] = function $eqExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("eqExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "==" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "!=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "===" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "!==" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("relExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("relExpr", false, [], null);
    });
};

BSJSParser.prototype["relExpr"] = function $relExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("relExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ ">" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ ">=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "<" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "<=" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "instanceof" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "in" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("shiftExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("shiftExpr", false, [], null);
    });
};

BSJSParser.prototype["shiftExpr"] = function $shiftExpr() {
    return this._atomic(function() {
        var op, y;
        return this._rule("shiftExpr", false, [], null) && (this._atomic(function() {
            return this._rule("token", true, [ ">>>" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "<<<" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ ">>" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("addExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("addExpr", false, [], null);
    });
};

BSJSParser.prototype["addExpr"] = function $addExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("addExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "+" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "-" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("mulExpr", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("mulExpr", false, [], null);
    });
};

BSJSParser.prototype["mulExpr"] = function $mulExpr() {
    return this._atomic(function() {
        var x, op, y;
        return this._rule("mulExpr", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "*" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "/" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "%" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("unary", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
    }) || this._atomic(function() {
        return this._rule("unary", false, [], null);
    });
};

BSJSParser.prototype["unary"] = function $unary() {
    return this._atomic(function() {
        var op, p;
        return (this._atomic(function() {
            return this._rule("token", true, [ "-" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "+" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("postfix", false, [], null) && (p = this._getIntermediate(), true) && this._exec([ "unop", op, p ]);
    }) || this._atomic(function() {
        var op, p;
        return (this._atomic(function() {
            return this._rule("token", true, [ "--" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "++" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("postfix", false, [], null) && (p = this._getIntermediate(), true) && this._exec([ "preop", op, p ]);
    }) || this._atomic(function() {
        var op, p;
        return (this._atomic(function() {
            return this._rule("token", true, [ "!" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "~" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "void" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "delete" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "typeof" ], null);
        })) && (op = this._getIntermediate(), true) && this._rule("unary", false, [], null) && (p = this._getIntermediate(), true) && this._exec([ "unop", op, p ]);
    }) || this._atomic(function() {
        return this._rule("postfix", false, [], null);
    });
};

BSJSParser.prototype["postfix"] = function $postfix() {
    var p;
    return this._rule("primExpr", false, [], null) && (p = this._getIntermediate(), true) && (this._atomic(function() {
        var op;
        return this._rule("spacesNoNl", false, [], null) && (this._atomic(function() {
            return this._rule("token", true, [ "++" ], null);
        }) || this._atomic(function() {
            return this._rule("token", true, [ "--" ], null);
        })) && (op = this._getIntermediate(), true) && this._exec([ "postop", op, p ]);
    }) || this._atomic(function() {
        return this._rule("empty", false, [], null) && this._exec(p);
    }));
};

BSJSParser.prototype["primExpr"] = function $primExpr() {
    return this._atomic(function() {
        var p;
        return this._rule("primExpr", false, [], null) && (p = this._getIntermediate(), true) && (this._atomic(function() {
            var i;
            return this._rule("token", true, [ "[" ], null) && this._rule("expr", false, [], null) && (i = this._getIntermediate(), true) && this._rule("token", true, [ "]" ], null) && this._exec([ "getp", i, p ]);
        }) || this._atomic(function() {
            var m, as;
            return this._rule("token", true, [ "." ], null) && this._rule("token", true, [ "name" ], null) && (m = this._getIntermediate(), true) && this._rule("token", true, [ "(" ], null) && this._rule("listOf", false, [ "asgnExpr", "," ], null) && (as = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._exec([ "send", m, p ].concat(as));
        }) || this._atomic(function() {
            var m, as;
            return this._rule("token", true, [ "." ], null) && this._rule("spaces", false, [], null) && this._rule("iName", false, [], null) && (m = this._getIntermediate(), true) && this._rule("token", true, [ "(" ], null) && this._rule("listOf", false, [ "asgnExpr", "," ], null) && (as = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("isKeyword", false, [ m ], null) && this._exec([ "send", m, p ].concat(as));
        }) || this._atomic(function() {
            var f;
            return this._rule("token", true, [ "." ], null) && this._rule("token", true, [ "name" ], null) && (f = this._getIntermediate(), true) && this._exec([ "getp", [ "string", f ], p ]);
        }) || this._atomic(function() {
            var f;
            return this._rule("token", true, [ "." ], null) && this._rule("spaces", false, [], null) && this._rule("iName", false, [], null) && (f = this._getIntermediate(), true) && this._rule("isKeyword", false, [ f ], null) && this._exec([ "getp", [ "string", f ], p ]);
        }) || this._atomic(function() {
            var as;
            return this._rule("token", true, [ "(" ], null) && this._rule("listOf", false, [ "asgnExpr", "," ], null) && (as = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._exec([ "call", p ].concat(as));
        }));
    }) || this._atomic(function() {
        return this._rule("primExprHd", false, [], null);
    });
};

BSJSParser.prototype["primExprHd"] = function $primExprHd() {
    return this._atomic(function() {
        var e;
        return this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (e = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._exec(e);
    }) || this._atomic(function() {
        return this._rule("token", true, [ "this" ], null) && this._exec([ "this" ]);
    }) || this._atomic(function() {
        var n;
        return this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._exec([ "get", n ]);
    }) || this._atomic(function() {
        var n;
        return this._rule("token", true, [ "number" ], null) && (n = this._getIntermediate(), true) && this._exec([ "number", n ]);
    }) || this._atomic(function() {
        var s;
        return this._rule("token", true, [ "string" ], null) && (s = this._getIntermediate(), true) && this._exec([ "string", s ]);
    }) || this._atomic(function() {
        return this._rule("token", true, [ "function" ], null) && this._rule("funcRest", false, [], null);
    }) || this._atomic(function() {
        var n, as;
        return this._rule("token", true, [ "new" ], null) && this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._rule("token", true, [ "(" ], null) && this._rule("listOf", false, [ "asgnExpr", "," ], null) && (as = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._exec([ "new", n ].concat(as));
    }) || this._atomic(function() {
        var n;
        return this._rule("token", true, [ "new" ], null) && this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._exec([ "new", n ]);
    }) || this._atomic(function() {
        var es;
        return this._rule("token", true, [ "[" ], null) && this._rule("listOf", false, [ "asgnExpr", "," ], null) && (es = this._getIntermediate(), true) && this._rule("token", true, [ "]" ], null) && this._exec([ "arr" ].concat(es));
    }) || this._atomic(function() {
        return this._rule("json", false, [], null);
    }) || this._atomic(function() {
        return this._rule("re", false, [], null);
    });
};

BSJSParser.prototype["json"] = function $json() {
    var bs;
    return this._rule("token", true, [ "{" ], null) && this._rule("listOf", false, [ "jsonBinding", "," ], null) && (bs = this._getIntermediate(), true) && this._rule("token", true, [ "}" ], null) && this._exec([ "json" ].concat(bs));
};

BSJSParser.prototype["jsonBinding"] = function $jsonBinding() {
    var n, v;
    return this._rule("jsonPropName", false, [], null) && (n = this._getIntermediate(), true) && this._rule("token", true, [ ":" ], null) && this._rule("asgnExpr", false, [], null) && (v = this._getIntermediate(), true) && this._exec([ "binding", n, v ]);
};

BSJSParser.prototype["jsonPropName"] = function $jsonPropName() {
    return this._atomic(function() {
        return this._rule("token", true, [ "name" ], null);
    }) || this._atomic(function() {
        return this._rule("token", true, [ "number" ], null);
    }) || this._atomic(function() {
        return this._rule("token", true, [ "string" ], null);
    }) || this._atomic(function() {
        var n;
        return this._rule("spaces", false, [], null) && this._rule("iName", false, [], null) && (n = this._getIntermediate(), true) && this._rule("isKeyword", false, [ n ], null) && this._exec(n);
    });
};

BSJSParser.prototype["re"] = function $re() {
    var x;
    return this._rule("spaces", false, [], null) && this._list(function() {
        return this._match("/") && this._rule("reBody", false, [], null) && this._match("/") && this._any(function() {
            return this._rule("reFlag", false, [], null);
        });
    }, true) && (x = this._getIntermediate(), true) && this._exec([ "regExp", x ]);
};

BSJSParser.prototype["reBody"] = function $reBody() {
    return this._rule("re1stChar", false, [], null) && this._any(function() {
        return this._rule("reChar", false, [], null);
    });
};

BSJSParser.prototype["re1stChar"] = function $re1stChar() {
    return this._atomic(function() {
        return this._atomic(function() {
            return !(this._match("*") || this._match("\\") || this._match("/") || this._match("["));
        }, true) && this._rule("reNonTerm", false, [], null);
    }) || this._atomic(function() {
        return this._rule("escapeChar", false, [], null);
    }) || this._atomic(function() {
        return this._rule("reClass", false, [], null);
    });
};

BSJSParser.prototype["reChar"] = function $reChar() {
    return this._atomic(function() {
        return this._rule("re1stChar", false, [], null);
    }) || this._match("*");
};

BSJSParser.prototype["reNonTerm"] = function $reNonTerm() {
    return this._atomic(function() {
        return !(this._match("\n") || this._match("\r"));
    }, true) && this._rule("char", false, [], null);
};

BSJSParser.prototype["reClass"] = function $reClass() {
    return this._match("[") && this._any(function() {
        return this._rule("reClassChar", false, [], null);
    }) && this._match("]");
};

BSJSParser.prototype["reClassChar"] = function $reClassChar() {
    return this._atomic(function() {
        return !(this._match("[") || this._match("]"));
    }, true) && this._rule("reChar", false, [], null);
};

BSJSParser.prototype["reFlag"] = function $reFlag() {
    return this._rule("nameFirst", false, [], null);
};

BSJSParser.prototype["formal"] = function $formal() {
    return this._rule("spaces", false, [], null) && this._rule("token", true, [ "name" ], null);
};

BSJSParser.prototype["funcRest"] = function $funcRest() {
    var fs, body;
    return this._rule("token", true, [ "(" ], null) && this._rule("listOf", false, [ "formal", "," ], null) && (fs = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("token", true, [ "{" ], null) && this._rule("srcElems", false, [], null) && (body = this._getIntermediate(), true) && this._rule("token", true, [ "}" ], null) && this._exec([ "func", fs, body ]);
};

BSJSParser.prototype["sc"] = function $sc() {
    return this._atomic(function() {
        return this._rule("spacesNoNl", false, [], null) && (this._match("\n") || this._atomic(function() {
            return this._atomic(function() {
                return this._match("}");
            }, true);
        }) || this._atomic(function() {
            return this._rule("end", false, [], null);
        }));
    }) || this._atomic(function() {
        return this._rule("token", true, [ ";" ], null);
    });
};

BSJSParser.prototype["binding"] = function $binding() {
    return this._atomic(function() {
        var n, v;
        return this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._rule("token", true, [ "=" ], null) && this._rule("asgnExpr", false, [], null) && (v = this._getIntermediate(), true) && this._exec([ n, v ]);
    }) || this._atomic(function() {
        var n;
        return this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._exec([ n ]);
    });
};

BSJSParser.prototype["block"] = function $block() {
    var ss;
    return this._rule("token", true, [ "{" ], null) && this._rule("srcElems", false, [], null) && (ss = this._getIntermediate(), true) && this._rule("token", true, [ "}" ], null) && this._exec(ss);
};

BSJSParser.prototype["vars"] = function $vars() {
    var bs;
    return this._rule("token", true, [ "var" ], null) && this._rule("listOf", false, [ "binding", "," ], null) && (bs = this._getIntermediate(), true) && this._exec([ "var" ].concat(bs));
};

BSJSParser.prototype["stmt"] = function $stmt() {
    return this._atomic(function() {
        return this._rule("block", false, [], null);
    }) || this._atomic(function() {
        var bs;
        return this._rule("vars", false, [], null) && (bs = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._exec(bs);
    }) || this._atomic(function() {
        var c, t, f;
        return this._rule("token", true, [ "if" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (c = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("stmt", false, [], null) && (t = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "else" ], null) && this._rule("stmt", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "undefined" ]);
        })) && (f = this._getIntermediate(), true) && this._exec([ "if", c, t, f ]);
    }) || this._atomic(function() {
        var c, s;
        return this._rule("token", true, [ "while" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (c = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "while", c, s ]);
    }) || this._atomic(function() {
        var s, c;
        return this._rule("token", true, [ "do" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._rule("token", true, [ "while" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (c = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("sc", false, [], null) && this._exec([ "doWhile", s, c ]);
    }) || this._atomic(function() {
        var i, c, u, s;
        return this._rule("token", true, [ "for" ], null) && this._rule("token", true, [ "(" ], null) && (this._atomic(function() {
            return this._rule("vars", false, [], null);
        }) || this._atomic(function() {
            return this._rule("expr", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "undefined" ]);
        })) && (i = this._getIntermediate(), true) && this._rule("token", true, [ ";" ], null) && (this._atomic(function() {
            return this._rule("expr", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "true" ]);
        })) && (c = this._getIntermediate(), true) && this._rule("token", true, [ ";" ], null) && (this._atomic(function() {
            return this._rule("expr", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "undefined" ]);
        })) && (u = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "for", i, c, u, s ]);
    }) || this._atomic(function() {
        var cond, s;
        return this._rule("token", true, [ "for" ], null) && this._rule("token", true, [ "(" ], null) && (this._atomic(function() {
            var b, e;
            return this._rule("token", true, [ "var" ], null) && this._rule("binding", false, [], null) && (b = this._getIntermediate(), true) && this._rule("token", true, [ "in" ], null) && this._rule("asgnExpr", false, [], null) && (e = this._getIntermediate(), true) && this._exec([ [ "var", b ], e ]);
        }) || this._atomic(function() {
            var e;
            return this._rule("expr", false, [], null) && (e = this._getIntermediate(), true) && e[0] === "binop" && e[1] === "in" && this._exec(function() {
                return e.slice(2);
            }.call(this));
        })) && (cond = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "forIn", cond[0], cond[1], s ]);
    }) || this._atomic(function() {
        var e, cs;
        return this._rule("token", true, [ "switch" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (e = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("token", true, [ "{" ], null) && this._any(function() {
            return this._atomic(function() {
                var c, cs;
                return this._rule("token", true, [ "case" ], null) && this._rule("asgnExpr", false, [], null) && (c = this._getIntermediate(), true) && this._rule("token", true, [ ":" ], null) && this._rule("srcElems", false, [], null) && (cs = this._getIntermediate(), true) && this._exec([ "case", c, cs ]);
            }) || this._atomic(function() {
                var cs;
                return this._rule("token", true, [ "default" ], null) && this._rule("token", true, [ ":" ], null) && this._rule("srcElems", false, [], null) && (cs = this._getIntermediate(), true) && this._exec([ "default", cs ]);
            });
        }) && (cs = this._getIntermediate(), true) && this._rule("token", true, [ "}" ], null) && this._exec([ "switch", e ].concat(cs));
    }) || this._atomic(function() {
        return this._rule("token", true, [ "break" ], null) && this._rule("sc", false, [], null) && this._exec([ "break" ]);
    }) || this._atomic(function() {
        return this._rule("token", true, [ "continue" ], null) && this._rule("sc", false, [], null) && this._exec([ "continue" ]);
    }) || this._atomic(function() {
        var e;
        return this._rule("token", true, [ "throw" ], null) && this._rule("spacesNoNl", false, [], null) && this._rule("asgnExpr", false, [], null) && (e = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._exec([ "throw", e ]);
    }) || this._atomic(function() {
        var t, e, c, f;
        return this._rule("token", true, [ "try" ], null) && this._rule("block", false, [], null) && (t = this._getIntermediate(), true) && this._rule("token", true, [ "catch" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("token", true, [ "name" ], null) && (e = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("block", false, [], null) && (c = this._getIntermediate(), true) && (this._atomic(function() {
            return this._rule("token", true, [ "finally" ], null) && this._rule("block", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "undefined" ]);
        })) && (f = this._getIntermediate(), true) && this._exec([ "try", t, e, c, f ]);
    }) || this._atomic(function() {
        var e;
        return this._rule("token", true, [ "return" ], null) && (this._atomic(function() {
            return this._rule("expr", false, [], null);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec([ "get", "undefined" ]);
        })) && (e = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._exec([ "return", e ]);
    }) || this._atomic(function() {
        var x, s;
        return this._rule("token", true, [ "with" ], null) && this._rule("token", true, [ "(" ], null) && this._rule("expr", false, [], null) && (x = this._getIntermediate(), true) && this._rule("token", true, [ ")" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "with", x, s ]);
    }) || this._atomic(function() {
        var label, s;
        return this._rule("iName", false, [], null) && (label = this._getIntermediate(), true) && this._rule("token", true, [ ":" ], null) && this._rule("stmt", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "label", label, s ]);
    }) || this._atomic(function() {
        var e;
        return this._rule("expr", false, [], null) && (e = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._exec(e);
    }) || this._atomic(function() {
        return this._rule("token", true, [ ";" ], null) && this._exec([ "get", "undefined" ]);
    });
};

BSJSParser.prototype["srcElem"] = function $srcElem() {
    return this._atomic(function() {
        var n, f;
        return this._rule("token", true, [ "function" ], null) && this._rule("token", true, [ "name" ], null) && (n = this._getIntermediate(), true) && this._rule("funcRest", false, [], null) && (f = this._getIntermediate(), true) && this._exec([ "var", [ n, f ] ]);
    }) || this._atomic(function() {
        return this._rule("stmt", false, [], null);
    });
};

BSJSParser.prototype["srcElems"] = function $srcElems() {
    var ss;
    return this._any(function() {
        return this._rule("srcElem", false, [], null);
    }) && (ss = this._getIntermediate(), true) && this._exec([ "begin" ].concat(ss));
};

BSJSParser.prototype["topLevel"] = function $topLevel() {
    var r;
    return this._rule("srcElems", false, [], null) && (r = this._getIntermediate(), true) && this._rule("spaces", false, [], null) && this._rule("end", false, [], null) && this._exec(r);
};

BSJSParser.hexDigits = "0123456789abcdef", BSJSParser.keywords = {}, keywords = [ "break", "case", "catch", "continue", "default", "delete", "do", "else", "finally", "for", "function", "if", "in", "instanceof", "new", "return", "switch", "this", "throw", "try", "typeof", "var", "void", "while", "with", "ometa" ];

for (var idx = 0; idx < keywords.length; idx++) BSJSParser.keywords[keywords[idx]] = !0;

BSJSParser._isKeyword = function(a) {
    return BSJSParser.keywords.hasOwnProperty(a);
};

var BSSemActionParser = function BSSemActionParser(source) {
    BSJSParser.call(this, source);
};

BSSemActionParser.match = BSJSParser.match;

BSSemActionParser.matchAll = BSJSParser.matchAll;

exports.BSSemActionParser = BSSemActionParser;

require("util").inherits(BSSemActionParser, BSJSParser);

BSSemActionParser.prototype["curlySemAction"] = function $curlySemAction() {
    var s;
    return this._atomic(function() {
        var r;
        return this._rule("token", true, [ "{" ], null) && this._rule("asgnExpr", false, [], null) && (r = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._rule("token", true, [ "}" ], null) && this._rule("spaces", false, [], null) && this._exec(r);
    }) || this._atomic(function() {
        var ss, s;
        return this._rule("token", true, [ "{" ], null) && this._any(function() {
            return this._rule("srcElem", false, [], null) && (s = this._getIntermediate(), true) && this._atomic(function() {
                return this._rule("srcElem", false, [], null);
            }, true) && this._exec(s);
        }) && (ss = this._getIntermediate(), true) && (this._atomic(function() {
            var r;
            return this._rule("asgnExpr", false, [], null) && (r = this._getIntermediate(), true) && this._rule("sc", false, [], null) && this._exec([ "return", r ]);
        }) || this._atomic(function() {
            return this._rule("srcElem", false, [], null);
        })) && (s = this._getIntermediate(), true) && this._exec(ss.push(s)) && this._rule("token", true, [ "}" ], null) && this._rule("spaces", false, [], null) && this._exec([ "send", "call", [ "func", [], [ "begin" ].concat(ss) ], [ "this" ] ]);
    });
};

BSSemActionParser.prototype["semAction"] = function $semAction() {
    return this._atomic(function() {
        return this._rule("curlySemAction", false, [], null);
    }) || this._atomic(function() {
        var r;
        return this._rule("primExpr", false, [], null) && (r = this._getIntermediate(), true) && this._rule("spaces", false, [], null) && this._exec(r);
    });
};

var BSJSIdentity = function BSJSIdentity(source) {
    AbstractGrammar.call(this, source);
};

BSJSIdentity.match = AbstractGrammar.match;

BSJSIdentity.matchAll = AbstractGrammar.matchAll;

exports.BSJSIdentity = BSJSIdentity;

require("util").inherits(BSJSIdentity, AbstractGrammar);

BSJSIdentity.prototype["trans"] = function $trans() {
    return this._atomic(function() {
        var t, ans;
        return this._list(function() {
            return this._skip() && (t = this._getIntermediate(), true) && this._rule("apply", false, [ t ], null) && (ans = this._getIntermediate(), true);
        }) && this._exec(ans);
    }) || this._atomic(function() {
        var t;
        return this._list(function() {
            return this._skip() && (t = this._getIntermediate(), true);
        }) && this._exec(t);
    });
};

BSJSIdentity.prototype["curlyTrans"] = function $curlyTrans() {
    return this._atomic(function() {
        var r;
        return this._list(function() {
            return this._match("begin") && this._rule("curlyTrans", false, [], null) && (r = this._getIntermediate(), true);
        }) && this._exec([ "begin", r ]);
    }) || this._atomic(function() {
        var rs;
        return this._list(function() {
            return this._match("begin") && this._any(function() {
                return this._rule("trans", false, [], null);
            }) && (rs = this._getIntermediate(), true);
        }) && this._exec([ "begin" ].concat(rs));
    }) || this._atomic(function() {
        var r;
        return this._rule("trans", false, [], null) && (r = this._getIntermediate(), true) && this._exec(r);
    });
};

BSJSIdentity.prototype["this"] = function $this() {
    return this._exec([ "this" ]);
};

BSJSIdentity.prototype["break"] = function $break() {
    return this._exec([ "break" ]);
};

BSJSIdentity.prototype["continue"] = function $continue() {
    return this._exec([ "continue" ]);
};

BSJSIdentity.prototype["number"] = function $number() {
    var n;
    return this._skip() && (n = this._getIntermediate(), true) && this._exec([ "number", n ]);
};

BSJSIdentity.prototype["string"] = function $string() {
    var s;
    return this._skip() && (s = this._getIntermediate(), true) && this._exec([ "string", s ]);
};

BSJSIdentity.prototype["regExp"] = function $regExp() {
    var x;
    return this._skip() && (x = this._getIntermediate(), true) && this._exec([ "regExp", x ]);
};

BSJSIdentity.prototype["arr"] = function $arr() {
    var xs;
    return this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (xs = this._getIntermediate(), true) && this._exec([ "arr" ].concat(xs));
};

BSJSIdentity.prototype["unop"] = function $unop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "unop", op, x ]);
};

BSJSIdentity.prototype["get"] = function $get() {
    var x;
    return this._skip() && (x = this._getIntermediate(), true) && this._exec([ "get", x ]);
};

BSJSIdentity.prototype["getp"] = function $getp() {
    var fd, x;
    return this._rule("trans", false, [], null) && (fd = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "getp", fd, x ]);
};

BSJSIdentity.prototype["set"] = function $set() {
    var lhs, rhs;
    return this._rule("trans", false, [], null) && (lhs = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec([ "set", lhs, rhs ]);
};

BSJSIdentity.prototype["mset"] = function $mset() {
    var lhs, op, rhs;
    return this._rule("trans", false, [], null) && (lhs = this._getIntermediate(), true) && this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec([ "mset", lhs, op, rhs ]);
};

BSJSIdentity.prototype["binop"] = function $binop() {
    var op, x, y;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "binop", op, x, y ]);
};

BSJSIdentity.prototype["preop"] = function $preop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "preop", op, x ]);
};

BSJSIdentity.prototype["postop"] = function $postop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "postop", op, x ]);
};

BSJSIdentity.prototype["return"] = function $return() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "return", x ]);
};

BSJSIdentity.prototype["with"] = function $with() {
    var x, s;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (s = this._getIntermediate(), true) && this._exec([ "with", x, s ]);
};

BSJSIdentity.prototype["label"] = function $label() {
    var name, body;
    return this._skip() && (name = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (body = this._getIntermediate(), true) && this._exec([ "label", name, body ]);
};

BSJSIdentity.prototype["if"] = function $if() {
    var cond, t, e;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (t = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (e = this._getIntermediate(), true) && this._exec([ "if", cond, t, e ]);
};

BSJSIdentity.prototype["condExpr"] = function $condExpr() {
    var cond, t, e;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (t = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (e = this._getIntermediate(), true) && this._exec([ "condExpr", cond, t, e ]);
};

BSJSIdentity.prototype["while"] = function $while() {
    var cond, body;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec([ "while", cond, body ]);
};

BSJSIdentity.prototype["doWhile"] = function $doWhile() {
    var body, cond;
    return this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._exec([ "doWhile", body, cond ]);
};

BSJSIdentity.prototype["for"] = function $for() {
    var init, cond, upd, body;
    return this._rule("trans", false, [], null) && (init = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (upd = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec([ "for", init, cond, upd, body ]);
};

BSJSIdentity.prototype["forIn"] = function $forIn() {
    var x, arr, body;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (arr = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec([ "forIn", x, arr, body ]);
};

BSJSIdentity.prototype["begin"] = function $begin() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("end", false, [], null) && this._exec([ "begin", x ]);
};

BSJSIdentity.prototype["begin"] = function $begin() {
    var xs;
    return this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (xs = this._getIntermediate(), true) && this._exec([ "begin" ].concat(xs));
};

BSJSIdentity.prototype["func"] = function $func() {
    var args, body;
    return this._skip() && (args = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec([ "func", args, body ]);
};

BSJSIdentity.prototype["call"] = function $call() {
    var fn, args;
    return this._rule("trans", false, [], null) && (fn = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec([ "call", fn ].concat(args));
};

BSJSIdentity.prototype["send"] = function $send() {
    var msg, recv, args;
    return this._skip() && (msg = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (recv = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec([ "send", msg, recv ].concat(args));
};

BSJSIdentity.prototype["new"] = function $new() {
    var cls, args;
    return this._skip() && (cls = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec([ "new", cls ].concat(args));
};

BSJSIdentity.prototype["var"] = function $var() {
    var vs;
    return this._many(function() {
        return this._rule("varItem", false, [], null);
    }) && (vs = this._getIntermediate(), true) && this._exec([ "var" ].concat(vs));
};

BSJSIdentity.prototype["varItem"] = function $varItem() {
    return this._atomic(function() {
        var n, v;
        return this._list(function() {
            return this._skip() && (n = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (v = this._getIntermediate(), true);
        }) && this._exec([ n, v ]);
    }) || this._atomic(function() {
        var n;
        return this._list(function() {
            return this._skip() && (n = this._getIntermediate(), true);
        }) && this._exec([ n ]);
    });
};

BSJSIdentity.prototype["throw"] = function $throw() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec([ "throw", x ]);
};

BSJSIdentity.prototype["try"] = function $try() {
    var x, name, c, f;
    return this._rule("curlyTrans", false, [], null) && (x = this._getIntermediate(), true) && this._skip() && (name = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (c = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (f = this._getIntermediate(), true) && this._exec([ "try", x, name, c, f ]);
};

BSJSIdentity.prototype["json"] = function $json() {
    var props;
    return this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (props = this._getIntermediate(), true) && this._exec([ "json" ].concat(props));
};

BSJSIdentity.prototype["binding"] = function $binding() {
    var name, val;
    return this._skip() && (name = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (val = this._getIntermediate(), true) && this._exec([ "binding", name, val ]);
};

BSJSIdentity.prototype["switch"] = function $switch() {
    var x, cases;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (cases = this._getIntermediate(), true) && this._exec([ "switch", x ].concat(cases));
};

BSJSIdentity.prototype["case"] = function $case() {
    var x, y;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "case", x, y ]);
};

BSJSIdentity.prototype["default"] = function $default() {
    var y;
    return this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec([ "default", y ]);
};

var BSJSTranslator = function BSJSTranslator(source) {
    AbstractGrammar.call(this, source);
};

BSJSTranslator.match = AbstractGrammar.match;

BSJSTranslator.matchAll = AbstractGrammar.matchAll;

exports.BSJSTranslator = BSJSTranslator;

require("util").inherits(BSJSTranslator, AbstractGrammar);

BSJSTranslator.prototype["trans"] = function $trans() {
    var t, ans;
    return this._list(function() {
        return this._skip() && (t = this._getIntermediate(), true) && this._rule("apply", false, [ t ], null) && (ans = this._getIntermediate(), true);
    }) && this._exec(ans);
};

BSJSTranslator.prototype["curlyTrans"] = function $curlyTrans() {
    return this._atomic(function() {
        var r;
        return this._list(function() {
            return this._match("begin") && this._rule("curlyTrans", false, [], null) && (r = this._getIntermediate(), true);
        }) && this._exec(r);
    }) || this._atomic(function() {
        var rs;
        return this._list(function() {
            return this._match("begin") && this._any(function() {
                return this._rule("trans", false, [], null);
            }) && (rs = this._getIntermediate(), true);
        }) && this._exec("{" + rs.join(";") + "}");
    }) || this._atomic(function() {
        var r;
        return this._rule("trans", false, [], null) && (r = this._getIntermediate(), true) && this._exec("{" + r + "}");
    });
};

BSJSTranslator.prototype["this"] = function $this() {
    return this._exec("this");
};

BSJSTranslator.prototype["break"] = function $break() {
    return this._exec("break");
};

BSJSTranslator.prototype["continue"] = function $continue() {
    return this._exec("continue");
};

BSJSTranslator.prototype["number"] = function $number() {
    var n;
    return this._skip() && (n = this._getIntermediate(), true) && this._exec("(" + n + ")");
};

BSJSTranslator.prototype["string"] = function $string() {
    var s;
    return this._skip() && (s = this._getIntermediate(), true) && this._exec(JSON.stringify(s));
};

BSJSTranslator.prototype["regExp"] = function $regExp() {
    var x;
    return this._skip() && (x = this._getIntermediate(), true) && this._exec(x);
};

BSJSTranslator.prototype["arr"] = function $arr() {
    var xs;
    return this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (xs = this._getIntermediate(), true) && this._exec("[" + xs.join(",") + "]");
};

BSJSTranslator.prototype["unop"] = function $unop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec("(" + op + " " + x + ")");
};

BSJSTranslator.prototype["getp"] = function $getp() {
    var fd, x;
    return this._rule("trans", false, [], null) && (fd = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec(x + "[" + fd + "]");
};

BSJSTranslator.prototype["get"] = function $get() {
    var x;
    return this._skip() && (x = this._getIntermediate(), true) && this._exec(x);
};

BSJSTranslator.prototype["set"] = function $set() {
    var lhs, rhs;
    return this._rule("trans", false, [], null) && (lhs = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec("(" + lhs + "=" + rhs + ")");
};

BSJSTranslator.prototype["mset"] = function $mset() {
    var lhs, op, rhs;
    return this._rule("trans", false, [], null) && (lhs = this._getIntermediate(), true) && this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (rhs = this._getIntermediate(), true) && this._exec("(" + lhs + op + "=" + rhs + ")");
};

BSJSTranslator.prototype["binop"] = function $binop() {
    var op, x, y;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec("(" + x + " " + op + " " + y + ")");
};

BSJSTranslator.prototype["preop"] = function $preop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec(op + x);
};

BSJSTranslator.prototype["postop"] = function $postop() {
    var op, x;
    return this._skip() && (op = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec(x + op);
};

BSJSTranslator.prototype["return"] = function $return() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec("return " + x);
};

BSJSTranslator.prototype["with"] = function $with() {
    var x, s;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (s = this._getIntermediate(), true) && this._exec("with(" + x + ")" + s);
};

BSJSTranslator.prototype["label"] = function $label() {
    var name, s;
    return this._skip() && (name = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (s = this._getIntermediate(), true) && this._exec(";" + name + ":" + s);
};

BSJSTranslator.prototype["if"] = function $if() {
    var cond, t, e;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (t = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (e = this._getIntermediate(), true) && this._exec("if(" + cond + ")" + t + "else" + e);
};

BSJSTranslator.prototype["condExpr"] = function $condExpr() {
    var cond, t, e;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (t = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (e = this._getIntermediate(), true) && this._exec("(" + cond + "?" + t + ":" + e + ")");
};

BSJSTranslator.prototype["while"] = function $while() {
    var cond, body;
    return this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec("while(" + cond + ")" + body);
};

BSJSTranslator.prototype["doWhile"] = function $doWhile() {
    var body, cond;
    return this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._exec("do" + body + "while(" + cond + ")");
};

BSJSTranslator.prototype["for"] = function $for() {
    var init, cond, upd, body;
    return this._rule("trans", false, [], null) && (init = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (cond = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (upd = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec("for(" + init + ";" + cond + ";" + upd + ")" + body);
};

BSJSTranslator.prototype["forIn"] = function $forIn() {
    var x, arr, body;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (arr = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec("for(" + x + " in " + arr + ")" + body);
};

BSJSTranslator.prototype["begin"] = function $begin() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("end", false, [], null) && this._exec(x);
};

BSJSTranslator.prototype["begin"] = function $begin() {
    var xs, x;
    return this._any(function() {
        return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && (this._atomic(function() {
            return (this._atomic(function() {
                return x[x.length - 1] === "}";
            }) || this._atomic(function() {
                return this._rule("end", false, [], null);
            })) && this._exec(x);
        }) || this._atomic(function() {
            return this._rule("empty", false, [], null) && this._exec(x + ";");
        }));
    }) && (xs = this._getIntermediate(), true) && this._exec("{" + xs.join("") + "}");
};

BSJSTranslator.prototype["func"] = function $func() {
    var args, body;
    return this._skip() && (args = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (body = this._getIntermediate(), true) && this._exec("(function (" + args.join(",") + ")" + body + ")");
};

BSJSTranslator.prototype["call"] = function $call() {
    var fn, args;
    return this._rule("trans", false, [], null) && (fn = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec(fn + "(" + args.join(",") + ")");
};

BSJSTranslator.prototype["send"] = function $send() {
    var msg, recv, args;
    return this._skip() && (msg = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (recv = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec(recv + "." + msg + "(" + args.join(",") + ")");
};

BSJSTranslator.prototype["new"] = function $new() {
    var cls, args;
    return this._skip() && (cls = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (args = this._getIntermediate(), true) && this._exec("new " + cls + "(" + args.join(",") + ")");
};

BSJSTranslator.prototype["var"] = function $var() {
    var vs;
    return this._many(function() {
        return this._rule("varItem", false, [], null);
    }) && (vs = this._getIntermediate(), true) && this._exec("var " + vs.join(","));
};

BSJSTranslator.prototype["varItem"] = function $varItem() {
    return this._atomic(function() {
        var n, v;
        return this._list(function() {
            return this._skip() && (n = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (v = this._getIntermediate(), true);
        }) && this._exec(n + " = " + v);
    }) || this._atomic(function() {
        var n;
        return this._list(function() {
            return this._skip() && (n = this._getIntermediate(), true);
        }) && this._exec(n);
    });
};

BSJSTranslator.prototype["throw"] = function $throw() {
    var x;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._exec("throw " + x);
};

BSJSTranslator.prototype["try"] = function $try() {
    var x, name, c, f;
    return this._rule("curlyTrans", false, [], null) && (x = this._getIntermediate(), true) && this._skip() && (name = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (c = this._getIntermediate(), true) && this._rule("curlyTrans", false, [], null) && (f = this._getIntermediate(), true) && this._exec("try " + x + "catch(" + name + ")" + c + "finally" + f);
};

BSJSTranslator.prototype["json"] = function $json() {
    var props;
    return this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (props = this._getIntermediate(), true) && this._exec("({" + props.join(",") + "})");
};

BSJSTranslator.prototype["binding"] = function $binding() {
    var name, val;
    return this._skip() && (name = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (val = this._getIntermediate(), true) && this._exec(JSON.stringify(name) + ": " + val);
};

BSJSTranslator.prototype["switch"] = function $switch() {
    var x, cases;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._any(function() {
        return this._rule("trans", false, [], null);
    }) && (cases = this._getIntermediate(), true) && this._exec("switch(" + x + "){" + cases.join(";") + "}");
};

BSJSTranslator.prototype["case"] = function $case() {
    var x, y;
    return this._rule("trans", false, [], null) && (x = this._getIntermediate(), true) && this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec("case " + x + ": " + y);
};

BSJSTranslator.prototype["default"] = function $default() {
    var y;
    return this._rule("trans", false, [], null) && (y = this._getIntermediate(), true) && this._exec("default: " + y);
};