// SPDX-FileCopyrightText: 2023 Jummit <jummit@web.de>
//
// SPDX-License-Identifier: LGPL-3.0-or-later

// TODO: @readability Break some lines.

const PREC = {
  GROUPING: 16,
  FACTOR: 15,
  NEGATE: 14, // - ! ~
  TERM: 13, // * / %
  EXPR: 12, // + -
  RANGE: 11,
  BITSHIFT: 10,
  BITAND: 9,
  BITXOR: 8,
  BITOR: 7,
  COMPARISON: 6,
  IS: 5,
  EQUALS: 4,
  AND: 3,
  OR: 2,
  CONDITIONAL: 1,
  ASSIGN: 0,
};

module.exports = grammar({
  name: "wren",

  extras: ($) => [$.comment, /\s|\\\r?\n/],

  rules: {
    source_file: ($) =>
      seq(optional($.shebang), repeat(choice($._statement, $._expression))),
    // TODO: @completeness Support foreign methods.
    // TODO: @correctness Add all escape codes here.
    string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            token.immediate(prec(1, choice(/[^"\\%]+/, /\\./))),
            seq("%(", repeat($._expression), ")"),
          ),
        ),
        '"',
      ),
    raw_string: ($) => seq(/"""/, repeat(/./), /"""/),
    comment: ($) =>
      choice(/\/\/.*/, seq("/*", repeat(choice($.comment, /./)), "*/")),
    static_field: ($) => /__[0-9A-Za-z]+[0-9A-Za-z_]*/,
    field: ($) => /_[0-9A-Za-z]+[0-9A-Za-z_]*/,
    name: ($) => /[a-zA-Z]+[0-9A-Za-z_]*/,
    null: ($) => "null",
    number: ($) =>
      choice(
        seq(
          /[+-]?[0-9]+/,
          token.immediate(optional(/\.[0-9]+/)),
          token.immediate(optional(/e[+-]?[0-9]{2}/)),
        ),
        /0x[0-9A-f]*/,
      ),
    boolean: ($) => choice("true", "false"),
    return_statement: ($) => seq("return", $._expression),
    // TODO: @correctness correct prescedence

    block: ($) => seq("{", repeat(choice($._statement, $._expression)), "}"),
    parameter: ($) => alias($.name, "parameter"),
    parameter_list: ($) => seq($.parameter, repeat(seq(",", $.parameter))),
    argument_list: ($) =>
      seq($._expression, optional(repeat(seq(",", $._expression)))),
    variable_definition: ($) =>
      seq("var", field("name", $.name), "=", $._expression),
    call_expression: ($) =>
      seq(
        field("function", choice($.name, $.index_expression)),
        "(",
        optional(alias($.argument_list, $.parameter_list)),
        ")",
      ),
    call_body: ($) =>
      seq(
        field("function", choice($.name, $.index_expression)),
        optional(
          seq("(", optional(alias($.argument_list, $.parameter_list)), ")"),
        ),
        seq(
          "{",
          optional(seq("|", alias($.argument_list, $.parameter_list), "|")),
          field("body", repeat(choice($._statement, $._expression))),
          "}",
        ),
      ),

    class_definition: ($) =>
      seq(
        repeat($._any_attribute),
        "class",
        $.name,
        optional(seq("is", $.name)),
        $.class_body,
      ),
    foreign_class_definition: ($) =>
      seq(repeat($._any_attribute), "foreign", "class", $.name, $.class_body),

    class_body: class_body,

    getter_definition: ($) => seq($.name, field("body", $.block)),
    foreign_getter_definition: ($) => seq("foreign", $.name),

    setter_definition: ($) =>
      seq($.name, "=", "(", $.parameter, ")", field("body", $.block)),
    foreign_setter_definition: ($) =>
      seq("foreign", $.name, "=", "(", $.parameter, ")"),

    foreign_method_internal: ($) =>
      seq($.name, "(", optional($.parameter_list), ")"),

    method_definition: ($) =>
      seq($.name, "(", optional($.parameter_list), ")", field("body", $.block)),
    foreign_method_definition: ($) => seq("foreign", $.foreign_method_internal),

    constructor: ($) => seq("construct", $.method_definition),
    foreign_constructor: ($) =>
      seq("foreign", "construct", $.foreign_method_internal),

    static_method_definition: ($) => seq("static", $.method_definition),
    foreign_static_method_definition: ($) =>
      prec(1, seq("foreign", "static", $.foreign_method_internal)),

    static_getter_definition: ($) =>
      seq("foreign", "static", $.name, "=", "(", $.parameter, ")"),
    foreign_static_getter_definition: ($) =>
      prec(1, seq("foreign", "static", $.name, "=", "(", $.parameter, ")")),

    prefix_operator_definition: ($) =>
      seq(
        alias(choice("+", "-", "*", "/"), $.operator),
        field("body", $.block),
      ),
    subscript_operator_definition: ($) =>
      seq("[", $.parameter_list, "]", field("body", $.block)),
    subscript_setter_definition: ($) =>
      seq(
        "[",
        $.parameter_list,
        "]",
        "=",
        "(",
        $.parameter,
        ")",
        field("body", $.block),
      ),
    infix_operator_definition: ($) =>
      seq(
        alias(choice("+", "-", "*", "/"), $.operator),
        "(",
        $.parameter,
        ")",
        field("body", $.block),
      ),
    conditional: ($) =>
      prec.left(seq($._expression, "?", $._expression, ":", $._expression)),
    list: ($) =>
      seq(
        "[",
        optional(seq($._expression, optional(repeat(seq(",", $._expression))))),
        "]",
      ),
    index_expression: ($) => seq($._expression, ".", $.name),

    if_statement: ($) =>
      prec.left(
        seq(
          "if",
          "(",
          $._expression,
          ")",
          choice($._statement, $._expression),
          optional(seq("else", alias($._statement, $.else_branch))),
        ),
      ),
    for_statement: ($) =>
      seq(
        "for",
        "(",
        field("loop_variable", $.name),
        "in",
        $._expression,
        ")",
        $._statement,
      ),
    while_statement: ($) =>
      seq(
        "while",
        "(",
        $._expression,
        ")",
        choice($._expression, $._statement),
      ),
    pair: ($) => seq($._expression, ":", $._expression),
    map: ($) =>
      prec(
        1,
        seq(
          "{",
          optional(seq($.pair, repeat(seq(",", $.pair)), optional(","))),
          "}",
        ),
      ),
    break_statement: ($) => "break",
    continue_statement: ($) => "continue",
    _any_attribute: ($) => choice($.attribute, $.runtime_attribute),
    attribute: ($) =>
      seq(
        "#",
        choice(
          $.attribute_value,
          seq(
            $.name,
            "(",
            seq($.attribute_value, repeat(seq(",", $.attribute_value))),
            ")",
          ),
        ),
      ),
    runtime_attribute: ($) =>
      seq(
        "#!",
        choice(
          $.attribute_value,
          seq(
            "(",
            optional(
              seq($.attribute_value, repeat(seq($.attribute_value, ","))),
            ),
            ")",
          ),
        ),
      ),
    attribute_value: ($) =>
      choice(
        $.name,
        seq(
          field("key", $.name),
          "=",
          field("value", choice($.name, $.string, $.boolean, $.number)),
        ),
      ),
    rename: ($) => seq($.name, "as", $.name),
    shebang: ($) => /#!.*/,
    _import_entry: ($) => choice($.name, $.rename),
    import_statement: ($) =>
      prec.right(
        seq(
          "import",
          $.string,
          optional(
            seq("for", $._import_entry, repeat(seq(",", $._import_entry))),
          ),
        ),
      ),
    _statement: ($) =>
      choice(
        $.return_statement,
        $.break_statement,
        $.continue_statement,
        $.class_definition,
        $.foreign_class_definition,
        $.variable_definition,
        $.if_statement,
        $.for_statement,
        $.while_statement,
        $.import_statement,
        $.block,
      ),
    _expression: ($) =>
      choice(
        prec.left(
          PREC.GROUPING,
          choice(
            seq($._expression, "[", $._expression, "]"),
            seq("(", $._expression, ")"),
          ),
        ),
        prec.left(
          PREC.FACTOR,
          choice(
            $.raw_string,
            $.string,
            $.boolean,
            $.number,
            $.null,
            $.static_field,
            $.field,
            $.name,
            $.list,
            $.map,
            $.index_expression,
            $.call_expression,
          ),
        ),
        prec.right(
          PREC.NEGATE,
          seq(alias(choice("!", "~", "-"), $.operator), $._expression),
        ),
        prec.left(
          PREC.TERM,
          seq(
            $._expression,
            alias(choice("*", "/", "%"), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.EXPR,
          seq(
            $._expression,
            alias(choice("-", "+"), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.RANGE,
          seq(
            $._expression,
            alias(choice("..", "..."), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.BITSHIFT,
          seq(
            $._expression,
            alias(choice("<<", ">>"), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.BITAND,
          seq($._expression, alias("&", $.operator), $._expression),
        ),
        prec.left(
          PREC.BITXOR,
          seq($._expression, alias("^", $.operator), $._expression),
        ),
        prec.left(
          PREC.BITOR,
          seq($._expression, alias("|", $.operator), $._expression),
        ),
        prec.left(
          PREC.COMPARISON,
          seq(
            $._expression,
            alias(choice("<", "<=", ">", ">="), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.IS,
          seq($._expression, alias("is", $.operator), $._expression),
        ),
        prec.left(
          PREC.EQUALS,
          seq(
            $._expression,
            alias(choice("==", "!="), $.operator),
            $._expression,
          ),
        ),
        prec.left(
          PREC.AND,
          seq($._expression, alias("&&", $.operator), $._expression),
        ),
        prec.left(
          PREC.OR,
          seq($._expression, alias("||", $.operator), $._expression),
        ),
        prec.right(
          PREC.CONDITIONAL,
          seq($._expression, "?", $._expression, ":", $._expression),
        ),
        prec.right(
          PREC.ASSIGN,
          seq(field("left", $._expression), "=", field("right", $._expression)),
        ),
      ),
  },
});

function class_body($) {
  const possible = [
    $.prefix_operator_definition,
    $.subscript_operator_definition,
    $.subscript_setter_definition,
    $.infix_operator_definition,

    $.constructor,
    $.getter_definition,
    $.setter_definition,
    $.static_method_definition,
    $.static_getter_definition,
    $.method_definition,

    $.foreign_constructor,
    $.foreign_getter_definition,
    $.foreign_setter_definition,
    $.foreign_static_method_definition,
    $.foreign_static_getter_definition,
    $.foreign_method_definition,
  ];

  return seq(
    "{",
    repeat(choice(...possible.map((a) => seq(repeat($.attribute), a)))),
    "}",
  );
}
