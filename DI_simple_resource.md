## Simple resource description ##

A single, simple resource should map to a simple JSON object with some property to designate it's URI. So:

```
  <http://www.w3.org/TR/rdf-syntax-grammar>
    dc:title "RDF/XML Syntax Specification (Revised)" .
```

maps to something like

```
  {
    "@": "http://www.w3.org/TR/rdf-syntax-grammar",
    "title": "RDF/XML Syntax Specification (Revised)"
  }
```

**Status:** Agreed but the naming of the property is open, candidates include `@`, `id`, `_about`.