## Resource references ##

When the object of a triple is a resource `http://example.com/foo` then the corresponding JSON encoding could be what?

  1. `"http://example.com/foo"`  - Jeni
  1. `"<http://example.com/foo>"` - RDFj
  1. `"<foo>"`                   -  RDFj with `base` set in the context
  1. `"someid"`                  - Exhibit where someid is the id of another object

Simple strings break round tripping, pointy-bracketed strings are arguably more surprising to target developers (and break round tripping in pathological cases), short form ID strings (similar to the abbreviation of properties) may be useful when referencing things like concepts in ontologies (e.g. `{ "type" : "Person" }`).

**Status:** Open