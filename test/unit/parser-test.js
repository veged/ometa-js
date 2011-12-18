var common = require('../fixtures/common'),
    assert = require('assert');

var units = [
  { hint: 'only keyword', src: 'ometa', throws: true },
  { hint: 'no closing bracket', src: 'ometa name {', throws: true },
  { hint: '<: without name', src: 'ometa name <: { }', throws: true },
  {
    hint: 'empty grammar',
    src: 'ometa name {\n}',
    dst: [ 'topLevel', [ [ 'grammar', 'name', null, [] ] ] ]
  },
  {
    hint: 'empty grammar and host code',
    src: 'var x = 1;\nometa name {\n};\nconsole.log("123");',
    dst: [ 'topLevel', [
        [ 'code', 'var x = 1;' ],
        [ 'grammar', 'name', null, [] ],
        [ 'code', ';\nconsole.log("123");']
    ] ]
  },
  {
    hint: 'two empty grammars',
    src: 'ometa name {\n} ometa name2 <: name {\n}',
    dst: [
      'topLevel',
      [
        [ 'grammar', 'name', null, [] ],
        [ 'grammar', 'name2', 'name', [] ]
      ]
    ]
  },
  {
    hint: 'grammar with one empty rule',
    src: 'ometa name { ruleName }',
    dst: [ 'topLevel', [ [
      'grammar', 'name', null,
      [ [ 'rule', 'ruleName', [] ] ]
    ] ] ]
  },
  {
    hint: 'grammar with one rule with arg',
    src: 'ometa name { rule :a }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [ 'rule', 'rule', [ [ 'arg', null, 'a' ] ] ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule with predicate',
    src: 'ometa name { ruleName = ?(doAnything())}',
    dst: [ 'topLevel', [ [
      'grammar', 'name', null,
      [ [ 'rule', 'ruleName', [
        [ 'predicate', '(doAnything())' ]
      ] ] ]
    ] ] ]
  },
  {
    hint: 'grammar with one rule with rule-arg',
    src: 'ometa name { rule sub:a }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule', [
              [ 'arg', [ 'match', null, 'sub' ], 'a' ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule with rule-arg + modificator',
    src: 'ometa name { rule sub*:a }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule', [
              [ 'arg', [ 'any', [ 'match', null, 'sub' ] ], 'a' ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule with super rule invocation',
    src: 'ometa name { rule ^rule }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule', [
              [ 'super', [ 'match', null, 'rule' ] ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule with rule-arg and arg',
    src: 'ometa name { rule sub :a }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule', [
              [ 'match', null, 'sub' ],
              [ 'arg', null, 'a']
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule and two args',
    src: 'ometa name { rule :a :b }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
          'rule', 'rule',
          [
            [ 'arg', null, 'a' ],
            [ 'arg', null, 'b' ]
          ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with two rules',
    src: 'ometa name { rule1 :a :b, rule2 :c :d }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [
          [
            'rule', 'rule1',
            [
              [ 'arg', null, 'a' ],
              [ 'arg', null, 'b' ]
            ]
          ],
          [
            'rule', 'rule2',
            [
              [ 'arg', null, 'c' ],
              [ 'arg', null, 'd' ]
            ]
          ]
        ]
      ] ]
    ]
  },
  {
    hint: 'two grammars with one rule and two args',
    src: 'ometa name { rule :a :b } ometa name2 { rule :c :d }',
    dst: [ 'topLevel',
      [
        [
          'grammar',
          'name',
          null,
          [ [
            'rule', 'rule',
            [
              [ 'arg', null, 'a' ],
              [ 'arg', null, 'b' ]
            ]
          ] ]
        ],
        [
          'grammar',
          'name2',
          null,
          [ [
            'rule', 'rule',
            [
              [ 'arg', null, 'c' ],
              [ 'arg', null, 'd' ]
            ]
          ] ]
        ]
      ]
    ]
  },
  {
    hint: 'grammar with one rule with one left-arg and one right-arg',
    src: 'ometa name { rule :a = :b }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
          'rule', 'rule',
          [
            [ 'arg', null, 'a' ],
            [ 'arg', null, 'b' ]
          ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with one rule with one left-arg and one right-arg in parens',
    src: 'ometa name { rule :a = (:b) }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule',
            [
              [ 'arg', null, 'a' ],
              [ 'choice', ['arg', null, 'b'] ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with two args in parens (:b | c | :d)',
    src: 'ometa name { rule (:b | c | :d) }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule',
            [
              [
                'choice',
                ['arg', null, 'b'],
                ['match', null, 'c'],
                ['arg', null, 'd']
              ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with array match rule',
    src: 'ometa name { rule [:a ["123" :b] :c] }',
    dst: [ 'topLevel',
      [ [
        'grammar',
        'name',
        null,
        [ [
            'rule', 'rule',
            [
              [
                'list',
                ['arg', null, 'a'],
                [
                  'list',
                  ['token', '123'],
                  ['arg', null, 'b']
                ],
                ['arg', null, 'c']
              ]
            ]
        ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with host language body of rule',
    src: 'ometa name { rule -> { x = y * x + fn(#1,2,3); } }',
    dst: [ 'topLevel',
      [ [
        'grammar', 'name', null,
        [ [ 'rule', 'rule', [[ 'result', '{ x = y * x + fn("1",2,3); } ' ]] ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with host language arg of rule',
    src: 'ometa name { rule { x = y * x + fn(1,2,3); } }',
    dst: [ 'topLevel',
      [ [
        'grammar', 'name', null,
        [ [ 'rule', 'rule', [ [ 'body', 'x = y * x + fn(1,2,3); ' ] ] ] ]
      ] ]
    ]
  },
  {
    hint: 'grammar with host language argument of rule',
    src: 'ometa name { rule another(1 + 2, [1,2,3].join(""),3):k -> k }',
    dst: [ 'topLevel', [ [
      'grammar',
      'name',
      null,
      [ [ 'rule',
          'rule',
          [ [ 'arg',
              [ 'call',
                [ null, 'another' ],
                [ '1 + 2', '[1,2,3].join("")', '3' ] ],
              'k'
            ],
            [ 'result', 'k ' ]
          ]
      ] ]
    ] ] ]
  },
  {
    hint: 'many small grammars',
    src: new Array(10000).join('ometa name { rule :a = (:b) }'),
    dst: false
  }
];

units.forEach(function(unit, i) {
  exports[unit.hint] = function(test) {
    if (unit.throws) {
      assert.throws(function () { common.parse(unit.src) });
    } else if (unit.dst) {
      assert.deepEqual(common.parse(unit.src), unit.dst);
    } else {
      var ast = common.parse(unit.src);
      assert.ok(Array.isArray(ast));
      assert.ok(ast.length > 0);
    }
    test.done();
  };
});
