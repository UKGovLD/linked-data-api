## bNodes - single reference ##

If the object of a triple is a bNode and there is no other reference to that bNode within the result set then the bNode should be encoded as a nested JSON object:

```
  <http://www.w3.org/TR/rdf-syntax-grammar>
    dc:title "RDF/XML Syntax Specification (Revised)" ;
    ex:editor [
      ex:fullName "Dave Beckett" ;
    ] .
```

maps to:

```
  {
    "@": "http://www.w3.org/TR/rdf-syntax-grammar",
    "title": "RDF/XML Syntax Specification (Revised)",
    "editor": {
      "fullName": "Dave Beckett",
    }
  } 
```

**Status:** Agreed?