## Specifying Mappings ##

In cases where the publisher (and, potentially the consumer for sophisticated consumers) wants to override the default mappings we need a declarative format for defining the mapping. Describing this mapping as an RDF graph enables it to be represented in a number of formats, including Turtle, RDF/XML and (through an API specification for these particular properties) JSON and possibly simple XML. Applications that can process RDF to create APIs must be able to understand RDF, so using that as the basic model provides us with flexibility. (It's also dog food.)

There are two levels of mapping that can be useful: global mappings and API-specific mappings.

### Global Mappings ###

It's possible to attach properties directly onto resources to provide mappings that might be used across multiple APIs. For example:

```
<http://www.w3.org/2000/01/rdf-schema#> api:prefPrefix "rdfs" .
<http://www.w3.org/2000/01/rdf-schema#label> api:prefLabel "label" .
```

These properties are:

  * `api:prefPrefix` is a literal property that specifies the preferred prefix for the subject resource, which should be a namespace
  * `api:altPrefix` is a literal property that specifies alternative prefixes for the subject resource, which should be a namespace
  * `api:prefLabel` is a literal property that specifies the preferred label for the subject resource, which may be a property, class or instance
  * `api:altLabel` is a literal property that specifies alternative labels for the subject resource, which may be a property, class or instance

### API-Specific Mappings ###

Where an API is built on top of a specific linked dataset, using known vocabularies, it may be preferable to override global mappings with ones that take advantage of the known characteristics of the linked dataset. For example, although the `geo` prefix is generally associated with `http://www.w3.org/2003/01/geo/wgs84_pos#`, in a dataset that doesn't use this vocabulary it may be preferable to associate `geo` with some other namespace.

To define these mappings, we define the following classes:

  * `api:API` is the class of linked data-based APIs
  * `api:Mapping` is the class of mappings for resources used by the API

and the following properties:

  * `api:version` is a literal property that specifies the version of an `api:API`. It's recommended that these versions follow [semantic versioning guidelines](http://semver.org/).
  * `api:mapping` is an object property that specifies an `api:Mapping` for an `api:API`
  * `api:namespace` is an object property that specifies the namespace that a `api:Mapping` refers to
  * `api:prefNamespacePrefix` is a literal property that specifies the preferred prefix for the namespace referred to by the subject `api:Mapping`
  * `api:altNamespacePrefix` is a literal property that specifies alternative prefixes for the namespace referred to by the subject `api:Mapping`
  * `api:property` is an object property that specifies the property that a `api:Mapping` refers to
  * `api:prefPropertyLabel` is a literal property that specifies the preferred label for the property referred to by the subject `api:Mapping`
  * `api:altPropertyLabel` is a literal property that specifies alternative labels for the property referred to by the subject `api:Mapping`

_Note (JeniT): This is just an initial list. We'll probably need more._

It's recommended that other properties are defined for `api:API` resources, for example using the Dublin Core properties. For example:

```
<http://transport.data.gov.uk/>
  a api:API ;
  api:version "0.1.0" ;
  dct:title "Government Transport Data"@en ;
  dct:subject 
    <http://dbpedia.org/resource/Transport> ,
    <http://dbpedia.org/resource/United_Kingdom> ;
  api:mapping [ 
    a api:Mapping ;
    api:property skos:prefLabel ;
    api:prefPropertyLabel "label" ;
    api:altPropertyLabel "pref_label" ;
  ], [
    a api:Mapping ;
    api:namespace <http://www.w3.org/2004/02/skos/core#> ;
    api:prefNamespacePrefix "skos" ;
  ] .
```


**Status:** Jeni proposes using RDF for this at least at the publisher end, Mark uses JSON when mapping the other way.