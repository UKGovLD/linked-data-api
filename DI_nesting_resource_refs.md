## Nesting resource references ##

In cases where the object of a property is a resource and that resource is also the subject of more triples in the results set there is a choice of whether to nest the JSON objects or flatten them.  So:

```
  <http://example.org/about>
    dc:title "Anna's Homepage"@en ;
    foaf:maker <http://example.org/anna> .

  <http://example.org/anna>
    foaf:name "Anna Wilder" ;
    foaf:homepage <http://example.org/about> .
```

could become:

```
  {
    "@": "http://example.org/about",
    "title": "Anna's Homepage",
    "maker": {
      "@": "http://example.org/anna",
      "name": "Anna Wilder",
      "homepage": "http://example.org/about"
    }
  }
```

or:

```
  {
    "@": "http://example.org/anna",
    "name": "Anna Wilder",
    "homepage": {
      "@": "http://example.org/about",
      "title": "Anna's Homepage",
      "maker": "http://example.org/anna"
    }
  } 
```

or:

```
[
  {
    "@": "http://example.org/anna",
    "name": "Anna Wilder",
    "homepage": "http://example.org/about"
  },
  {
    "@": "http://example.org/about",
    "title": "Anna's Homepage",
    "maker": "http://example.org/anna"
  }
]
```

In general there will be some non-tree graphs so nesting is not sufficient and in some cases clients will need to decide when to check up a URI link to see if it references to another resource in the results set. This interacts with [DI\_resource\_ref](DI_resource_ref.md).

_Der comment_: RDF/XML has the same issues. Experience with Jena suggests that controlling which nestings to prefer for the most common cases is possible ([pretty types](http://www.openjena.org/IO/iohowto.html#output)) but that there are always some applications that need a different nesting. Given our goals of simplicity I'm inclined to put everything at the top level, or only nest tree-structured references.

**Status:** open