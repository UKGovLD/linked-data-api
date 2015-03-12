## Typed literals - XSD types ##

Literals of type `xsd:decimal` (or its subtypes), `xsd:float` and `xsd:double` would all map to JSON integers.  This breaks round tripping though for properties that are used uniformly then the mapping table could include range information to enable inversion.

Literals of type xsd:dateTime might map to plain strings in RFC1123 format (for compatibility with Javascript's Date.parse) or could be handled as below.

Literals of other XSD types could be (1) just their lexical form as strings, (2) strings but with a range annotation in the mapping table, (3) strings in Turtle ^^ syntax, (4) structured objects.

**Status:** Numbers seem to be agreed, the rest are open.