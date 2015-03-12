

# Introduction #

This page describes an experimental translator which implements a starting set of design choices.

The intention is to update this implementation as we agree on the design decisions so that at any point there could be a live version to test against.

# API structure #

The translator is implemented in Java, built on top of Jena.
The translator supports:
  * encoding an ordered list of RDF resources from a single graph, with or without any resources then reference
  * encoding an entire RDF graph
  * encoding a DataSet (a default graph plus a set of named graphs)
  * customizing the coding by supplying an ontology
  * decoding back to an RDF graph (plus ordered list of root resources) or to a DataSet

Encoding can be optionally done relative to a base URI, in which case resource references that are extensions of that base will be encoded as relative URIs.

# Web endpoint #

To make it easy to experiment with the translation we've put up a simple web service using Google App Engine.

An interactive form that allows you to supply a source RDF graph and obtain the translation is at:  http://epimorph-pubx1.appspot.com/

The corresponding web endpoint is http://epimorph-pubx1.appspot.com/rdfToJSON and supports both a POST interface to implement the interactive form and a GET interface. Described in [help file](http://epimorph-pubx1.appspot.com/help.html).

The GET interface enables the endpoint to act as a proxy onto public linked data. So, for example, the following will fetch the DBPedia description of Cambridge, convert it to JSON and return a wrapped array of resources with the first entry corresponding to `http://dbpedia.org/resource/Cambridge` and the remainder encoding all referenced resources that are included in the same RDF graph:

http://epimorph-pubx1.appspot.com/rdfToJSON?url=http%3A%2F%2Fdbpedia.org%2Fresource%2FCambridge&PrettyPrint=true

There is no web endpoint for the decoder yet. @@TODO

# Design choices #

## API result wrapper ##

Results are wrapped in an outer object:

```
  {
    "format" : "linked-data-api",
    "version" : "0.0",
    "results" : [ ... resources ...],
    "context" : {  ... inverse mapping information }",
  }
```

## JSONP support ##

The proxy api supports a _callback_ optional parameter. While JSONP is a potential security risk if used to access protected information the proxy is limited to public data in any case.

## Communicating Mapping and context ##

The wrapper includes a _context_ object, as per RDFj, which provides a mapping table to invert the assignment of short names to properties and an (optional) base URI.

## Specifying the mapping ##

The mapping works with zero configuration.

Optional short-name assignment, hiding of some properties and designating properties as multivalued, is possible by supplying a separate Ontology graph. See [help file](http://epimorph-pubx1.appspot.com/help.html#ontology)

## Simple resource description ##

Currently uses `_about` as the property denoting the resource's URI.

## Property naming ##

Uses rdfs:label from the source graph or the separate (optional) ontology graph, if there is none uses localname if possible, if not possible (e.g. a clash) it appends a suffix to the localname.

Use of other labelling properties (e.g. skos:prefLabel) can be done by the caller by mapping such information to the labels in the ontology graph.

Note: The current code fails to check that labels match the NCName production. @@TODO

## bNodes - single reference ##

Encoded as inline objects.

## Resource references ##

Encoded within `<...>` at the moment. This choice is still open.

Strings starting with `<` get escaped.

## Multi-valued properties ##

An instance of a property with multiple values is mapped to a JSON Array, an instance with a single value maps to a single value.

Using the ontology graph it is possible to mark a Property as multivalued in which case it will always map to a JSON Array.

## List-valued properties ##

Mapped to a JSON Array as well.

If a property is consistently used to reference a list or simple nodes then the round tripping works (by recording range information in the context object).

## Language tagged literals ##

Encoded using `"lexical@lang"` format as in `rdf:PlainLiteral`. A plain literal without language tag will not have a trailing `@` (thus diverging from `rdf:PlainLiteral` but in keeping with developer expectations).

A non-language-tagged string which already includes an `@` will be escaped to `\@` to avoid confusion.

## Typed literals - XSD types ##

Numbers, booleans and simple strings map to the corresponding JSON types.

Round tripping of numbers will work if properties are used consistently (by recording the range in the context object). Even then precision of arbitrary xsd:decimals may be lost.

xsd:date and xsd:dateTime are mapped to strings in RFC1123 syntax to enable use of Javascript Date.parse.

All other types are mapped to `"lexical"^^type`. Plain strings containing `^^` will be escaped to `\^\^` to avoid confusion.

## Nesting resource references ##

Resource references are encoded purely as URIs, using `<...>` notation (absolute or relative). Depending on the API call used referenced resources which are in the source graph and not in the list of root resources to be serialized may or may not be tacked on the end of the serialized results array.  In the simple case of serializing a whole RDF graph then each distinct subject URI node in the graph will be encoded as a top level object in the result array.

## rdf:type shortcut ##

None at present.

## bNodes - graphs ##

A bNode referenced from multiple places will be serialized using `_:id`.

## Named graphs? ##

Supported. The default graph is serialized as the `results` array.

Any additional named graphs in the DataSet will be serialized as objects in a `graphs` property:

```
{
  "format":"linked-data-api",
  "version":"0.0",
  "results":[
    {
      "_about":"<http://www.epimorphics.com/tools/example#r>",
      "p":"foo"
    }
  ],
  "graphs":[
    {
      "_about":"<http://www.epimoporphics.com/graph1>",
      "results":[
        {
          "_about":"<http://www.epimorphics.com/tools/example#r2>",
          "p2":"foobar"
        }
      ]
    },
    ...
  ],
  "context":{  ...  }
  }
}
```

There is a single `context` object for the whole DataSet, unlike RDFj which supports nested and inherited contexts.