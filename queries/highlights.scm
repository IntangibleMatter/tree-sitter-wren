; basic types
(boolean) @boolean
(number) @number
(null) @constant
(string) @string
(raw_string) @string

(comment) @comment

(name) @variable


; keywords
"import" @keyword.import
"return" @keyword.return

; Special Builtins
;((identifier) @variable.builtin
;  (#any-of? @variable.builtin "self" "super"))

[
  "for"
  "while"
  ;"break"
  ;"continue"
] @keyword.repeat

[
  ;"foreign"
  "static"
] @keyword.modifier

[
  "in"
  "as"
  "is"
] @keyword.operator

[
  "("
  ")"
  "["
  "]"
  "{"
  "}"
] @punctuation.bracket

[
  "+"
  "-"
  "=="
  "!="
  "<="
  ">="
  "&&"
  "||"
  "/"
  "*"
  "%"
  ">>"
  "<<"
  "&"
  "<"
  ">"
] @operator
;(binary_operator) @operator
;(unary_operator) @operator

; blocks

