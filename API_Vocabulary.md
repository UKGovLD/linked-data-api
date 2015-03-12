[Go to Summary and Contents](Specification.md)

# Vocabulary & Configuration #

The linked data API middleware will work "out of the box", but it will usually need to be configured to get it to provide the API that the publisher requires. The configuration is expressed as RDF. This section defines the classes and properties that are used in that RDF and their effect on the behaviour of the implementation.

bq. Note that this RDF model is deliberately designed to make it easy to create a simple JSON representation of the RDF in which everything is nested within the API.

This specification does not define how the configuration should be supplied to an API implementation. The expectation is that configuration will be provided as a file, but implementations are free to support other options.

## API ##

The `api:API` class defines the API as a whole. It has the following properties:

  * `api:sparqlEndpoint` is the SPARQL endpoint from which the API retrieves the data it exposes. Every API must indicate a single SPARQL endpoint.
  * `api:base` is the base URI for the API
  * `api:contentNegotiation` points to either `api:suffix` or `api:parameter`.  If it points to `api:suffix` this indicates that the extension on the last segment of the path within the request URI should be used to determine the formatter that is used. If it points to `api:parameter` this indicates that the `_format` parameter should be used to determine the formatter that is used. If there is no `api:contentNegotiation` property for the API, the implementation should assume `api:suffix`.
  * `api:lang` is the default list of languages that are used to filter items included in a list, or values included in a view
  * `api:maxPageSize` is the maximum size of lists returned by the API
  * `api:defaultPageSize` is the default size of lists returned by the API (which may be overridden by an endpoint or in a particular request by the `_pageSize` request parameter)
  * `api:vocabulary` points to any RDF that contains the definitions of resources such as properties and classes that may be referenced with a short name
  * `api:variable` holds any variables that are defined throughout the API and available within the specifications of all endpoints
  * `api:endpoint` holds the `api:Endpoint`s that the API exposes

### Examples ###

```
<http://education.data.gov.uk/api> a api:API ;
  api:sparqlEndpoint <http://services.data.gov.uk/education/sparql> ;
  api:base "http://education.data.gov.uk/doc/" ;
  api:contentNegotiation api:suffix ;
  api:vocabulary "http://education.data.gov.uk/def/school" ;
  
  api:variable [
    a api:Variable ;
    api:name "base" ;
    api:value "http://education.data.gov.uk/id" ;
  ] ;
  
  api:endpoint [
    ...
  ], [
    ...
  ] .
```

### Vocabulary ###

```
api:API a rdfs:Class ;
  rdfs:label "API"@en .

api:sparqlEndpoint a rdf:Property ;
  rdfs:label "SPARQL endpoint"@en ;
  rdfs:comment "The endpoint used to serve up the results that are exposed by the API. This should not include the query parameters within the URI."@en ;
  rdfs:domain api:API ;
  rdfs:range rdfs:Resource .

api:base a rdf:Property ;
  rdfs:label "Base URI"@en ;
  rdfs:comment "The base URI of the API, which is distinct from the URI of the SPARQL endpoint that it queries or the base URI of the instances that it returns. This base URI is stripped from the request URI before any matching is done against the endpoints defined for the API."@en ;
  rdfs:domain api:API ;
  rdfs:range rdfs:Literal .

api:contentNegotiation a rdf:Property ;
  rdfs:label "Content Negotiation"@en ;
  rdfs:comment "The mechanism used within the URI to override normal content negotiation and deliver a particular results format."
  rdfs:domain api:API ;
  rdfs:range api:ContentNegotiationStrategy .

api:vocabulary a rdf:Property ;
  rdfs:label "Vocabulary"@en ;
  rdfs:comment "A vocabulary that should be used by the configuration to provide labels for properties. To be recognised for filtering, a property must be defined either within this vocabulary or in the configuration file itself."@en ;
  rdfs:domain api:API ;
  rdfs:range rdfs:Resource .

api:maxPageSize a rdf:Property ;
  rdfs:label "Maximum Page Size"@en ;
  rdfs:comment "The maximum size of lists that will be returned by the API."@en ;
  rdfs:domain api:API ;
  rdfs:range xsd:integer .

api:defaultPageSize a rdf:Property ;
  rdfs:label "Default Page Size"@en ;
  rdfs:comment "The default size of lists that will be returned by the API or endpoint."@en ;
  rdfs:range xsd:integer .

api:lang a rdf:Property ;
  rdfs:label "Language"@en ;
  rdfs:comment "A comma-separated list of languages used when filtering by value, or selecting which values to include within a view."@en .

api:ContentNegotiationStrategy a rdfs:Class ;
  rdfs:label "Content negotiation type"@en .

api:suffixBased a api:ContentNegotiationStrategy ;
  rdfs:label "Suffix-Based Content Negotiation"@en ;
  rdfs:comment "This content negotiation strategy uses the suffix used on the last segment within the request URI to indicate the formatter that should be used to format the results of the request."@en .

api:parameterBased a api:ContentNegotiationStrategy ;
  rdfs:label "Parameter-Based Content Negotiation"@en ;
  rdfs:comment "This content negotiation strategy uses the _format parameter within the URI to indicate the formatter that should be used to format the results of the request."@en .
  
api:endpoint a rdf:Property ;
  rdfs:label "Endpoint"@en ;
  rdfs:comment "An endpoint specified by the API, against which requests can be made."@en ;
  rdfs:domain api:API ;
  rdfs:range api:Endpoint .
```

## Endpoints ##

An `api:Endpoint` describes an endpoint against which requests can be made.

There are two types of end points:

  * `api:ItemEndpoint`s are endpoints that serve up individual items
  * `api:ListEndpoint`s are endpoints that serve up lists of items

Both types of endpoints can specify `api:viewer`s and `api:formatter`s for determining which properties of the item(s) should be exposed and how the resulting RDF graph should be formatted.

Item endpoints need a way of mapping the incoming URI to the URI of the item. This is provided through the `api:itemTemplate` property, which is a template that is completed using the in-scope variables on the endpoint.

List endpoints need a way of determining which items belong to a list. This is provided through a `api:Selector` indicated through the `api:selector` property.

All endpoints can have the following properties:

  * `api:uriTemplate` a template for a URI that the endpoint is used for. Within the template, variable names specified within curly braces are used to bind variables that can be used elsewhere.
  * `api:lang` is the list of languages that are used to filter items included in a list endpoint and values included in a view
  * `api:viewer` a viewer that can be used to view the item(s)
  * `api:defaultViewer` the viewer that will be used if no viewer is specified directly within the parameters passed in the request
  * `api:formatter` a formatter that can be used to format the result of the RDF graph
  * `api:defaultFormatter` the formatter that will be used if no formatter is specified directly in the request, either through the `Accept` header or through the suffix on the last path segment of the URI or through the `_format` parameter

### Examples ###

```
[] a api:ItemEndpoint ;
  api:uriTemplate "school/{code}" ;
  api:itemTemplate "{base}/school/{code}" ;
  api:defaultViewer api:labelledDescription .

[] a api:ListEndpoint ;
  api:uriTemplate "school" ;
  api:selector [
    api:filter "type=school" ;
  ] ;
  api:defaultViewer [
    api:name "basic" ;
    api:properties "name,type,localAuthority.name" ;
  ] .
```

### Vocabulary ###

```
api:Endpoint a rdfs:Class ;
  rdfs:label "Endpoint"@en ;
  rdfs:comment "An endpoint exposed by the API."@en .

api:ItemEndpoint a rdfs:Class ;
  rdfs:label "Item Endpoint"@en ;
  rdfs:comment "An endpoint that returns information about a single instance."@en ;
  rdfs:subClassOf api:Endpoint .

api:ListEndpoint a rdfs:Class ;
  rdfs:label "List Endpoint"@en ;
  rdfs:comment "An endpoint that returns information about a list of instances."@en ;
  rdfs:subClassOf api:Endpoint .

api:uriTemplate a rdf:Property ;
  rdfs:label "URI template"@en ;
  rdfs:comment "A template that can be used to match against request URIs. This template can contain variable names within {}s; when the URI is matched then the substrings that appear in these locations are bound to the named variable."@en ;
  rdfs:domain api:Endpoint ;
  rdfs:range rdfs:Literal .

api:itemTemplate a rdf:Property ;
  rdfs:label "Item template"@en ;
  rdfs:comment "A template for the URI of the item that the item endpoint should return. Any instances of {varName} within the string are replaced by the value of the relevant variable."@en ;
  rdfs:domain api:ItemEndpoint ;
  rdfs:range rdfs:Literal .

api:selector a rdf:Property ;
  rdfs:label "Selector"@en ;
  rdfs:comment "The selector that should be used to generate the list of items."@en ;
  rdfs:domain api:ListEndpoint ;
  rdfs:range rdfs:Literal .

api:viewer a rdf:Property ;
  rdfs:label "Viewer"@en ;
  rdfs:comment "A viewer that can be used with the endpoint."@en ;
  rdfs:domain api:Endpoint ;
  rdfs:range api:Viewer .

api:defaultViewer a rdf:Property ;
  rdfs:label "Default Viewer"@en ;
  rdfs:comment "The default viewer used if none is explicitly selected within the request URI."@en ;
  rdfs:domain api:Endpoint ;
  rdfs:range api:Viewer .

api:formatter a rdf:Property ;
  rdfs:label "Formatter"@en ;
  rdfs:comment "A formatter that can be used with the endpoint."@en ;
  rdfs:domain api:Endpoint ;
  rdfs:range api:Formatter .

api:defaultFormatter a rdf:Property ;
  rdfs:label "Default Formatter"@en ;
  rdfs:comment "The default formatter used if none is explicitly selected within the request URI."@en ;
  rdfs:domain api:Endpoint ;
  rdfs:range api:Formatter .
```

## Selectors ##

Selectors are used to select items that belong to a list. They have the following properties:

  * `api:parent` points to another selector that this one specialises
  * `api:select` holds a SELECT query
  * `api:where` holds a [GroupGraphPattern](http://www.w3.org/TR/rdf-sparql-query/#rGroupGraphPattern) which is used to construct a WHERE clause
  * `api:orderBy` holds a space separated list of [OrderConditions](http://www.w3.org/TR/rdf-sparql-query/#rOrderCondition) which are used to construct an ORDER BY clause
  * `api:filter` specifies a set of parameter bindings using the same syntax as is found in a URI query, using property paths
  * `api:sort` specifies a comma-separated list of sort specifications, using property paths

### Examples ###

```
_:schools a api:Selector ;
  api:filter "type=school" ;
  api:sort "name" .

_:primarySchools a api:Selector ;
  api:parent _:schools ;
  api:filter "type=primary" ;

rdf:type a rdf:Property ;
  api:label "type" ;
  rdfs:range rdfs:Resource .

sch:School a rdfs:Class ;
  api:label "school" .

sch:PrimarySchool a rdfs:Class ;
  api:label "primary" .
```

### Vocabulary ###

```
api:Selector a rdfs:Class ;
  rdfs:label "Selector"@en ;
  rdfs:comment "A specification of an ordered list of resources."@en .

api:parent a rdf:Property ;
  rdfs:label "Parent"@en ;
  rdfs:comment "The parent selector, from which filters and sort specifications may be inherited."@en ;
  rdfs:domain api:Selector ;
  rdfs:range api:Selector .

api:select a rdf:Property ;
  rdfs:label "Select"@en ;
  rdfs:comment "A SPARQL SELECT query that can be used to select an ordered list of resources. It should include the binding of an ?item variable for the selected items."@en ;
  rdfs:domain api:Selector ;
  rdfs:range rdf:PlainLiteral .

api:where a rdf:Property ;
  rdfs:label "Where"@en ;
  rdfs:comment "A GroupGraphPattern suitable for embedding within a SPARQL WHERE clause. This is used for filtering the set of items that the selector selects."@en ;
  rdfs:domain api:Selector ;
  rdfs:range rdf:PlainLiteral .

api:orderBy a rdf:Property ;
  rdfs:label "Order By"@en ;
  rdfs:comment "A space separated sequence of OrderConditions suitable for using in a SPARQL ORDER BY clause. This is used to order the sequence of items that the selector selects."@en ;
  rdfs:domain api:Selector ;
  rdfs:range rdf:PlainLiteral .

api:filter a rdf:Property ;
  rdfs:label "Filter"@en ;
  rdfs:comment "A set of parameter bindings in the same format as is used within the query of a URI, used to provide a simple way of filtering the sequence of items that the selector selects."@en ;
  rdfs:domain api:Selector ;
  rdfs:range rdf:PlainLiteral .

api:sort a rdf:Property ;
  rdfs:label "Sort"@en ;
  rdfs:comment "A sequence of comma-separated sort specifications indicating the sorting of the items in the sequence that the selector selects. A leading hyphen indicates a reverse sort."@en ;
  rdfs:domain api:Selector ;
  rdfs:range rdf:PlainLiteral .
```

## Viewers ##

Viewers are used to construct a graph based on the properties of the selected items. They have the following properties:

  * `api:name` holds the name of the viewer.
  * `api:template` holds a pattern in SPARQL syntax (specifically [ConstructTriples](http://www.w3.org/TR/rdf-sparql-query/#rConstructTriples)) that should be used to construct the graph
  * `api:property` indicates properties or lists of properties that should be used as property chains to identify the information to include
  * `api:properties` holds a comma-separated list of property paths that can be used to identify the information to include
  * `api:include` points to other viewers that define properties that should be shown

### Examples ###

```
_:contactViewer a api:Viewer ;
  api:name "contact" ;
  api:properties "name,number,address.street,address.region,address.city,address.postcode" .

_:adminViewer a api:Viewer ;
  api:name "admin" ;
  api:property
    rdfs:label ,
    skos:notation ,
    (sch:localAuthority rdfs:label) ,
    (sch:localAuthority skos:notation) .

_:detailsViewer a api:Viewer ;
  api:name "details" ;
  api:include _:contactViewer, _:adminViewer .
```

### Vocabulary ###

```
api:Viewer a rdfs:Class ;
  rdfs:label "Viewer"@en ;
  rdfs:comment "A specification of a view of a particular item."@en .

api:describeViewer a api:Viewer ;
  rdfs:label "DESCRIBE Viewer"@en ;
  rdfs:comment "A viewer that returns a graph created from a DESCRIBE query."@en ;
  api:name "describe" .

api:labelledDescribeViewer a api:Viewer ;
  rdfs:label "Labelled DESCRIBE Viewer"@en ;
  rdfs:comment "A viewer that returns the graph created from a DESCRIBE query, supplemented by labels for linked resources."@en ;
  api:name "labelledDescribe" .

api:basicViewer a api:Viewer ;
  rdfs:label "Basic Viewer"@en ;
  rdfs:comment "A viewer that returns the type and label of the item."@en ;
  api:name "basic" ;
  api:property rdfs:label, rdf:type .

api:name a rdf:Property ;
  rdfs:label "Name"@en ;
  rdfs:comment "The name of the resource."@en ;
  rdfs:range rdf:PlainLiteral .

api:include a rdf:Property ;
  rdfs:label "Include"@en ;
  rdfs:comment "Other viewers that describe properties that should be incorporated into this view."@en ;
  rdfs:domain api:Viewer ;
  rdfs:range api:Viewer .

api:template a rdf:Property ;
  rdfs:label "Template"@en ;
  rdfs:comment "SPARQL that can be used to construct a graph based on an item (identified in the SPARQL as ?item)."@en ;
  rdfs:domain api:Viewer ;
  rdfs:range rdf:PlainLiteral .

api:property a rdf:Property ;
  rdfs:label "Property"@en ;
  rdfs:comment "A property chain (which may be a single property) that indicates information that should be included in the view."@en ;
  rdfs:domain api:Viewer ;
  rdfs:range rdfs:Resource .

api:properties a rdf:Property ;
  rdfs:label "Properties"@en ;
  rdfs:comment "A comma-separated list of property paths that indicate the information that should be included in the view."@en ;
  rdfs:domain api:Viewer ;
  rdfs:range rdf:PlainLiteral .
```

## Formatters ##

Formatters determine how an RDF graph is serialised into a response. Each formatter has:

  * a `api:name` which is used to identify the formatter within the `_format` URI parameter or as the suffix if suffixes are used
  * a `api:mimeType` which is the mime type of the response

Other properties may be specified for the formatter, depending on its type. For example, instances of `api:XsltFormatter` will have a `api:stylesheet` property.

### Examples ###

```
_:schoolHTMLformatter a api:XsltFormatter ;
  api:name "html" ;
  api:mimeType "text/html" ;
  api:stylesheet </styles/school-to-html.xsl> .
```

### Vocabulary ###

```
api:Formatter a rdfs:Class ;
  rdfs:label "Formatter"@en ;
  rdfs:comment "A formatter that creates a representation from an RDF graph."@en .

api:mimeType a rdf:Property ;
  rdfs:label "Mime Type"@en ;
  rdfs:comment "The mime type that the formatter returns and that it should be used with."@en ;
  rdfs:domain api:Formatter ;
  rdfs:range rdf:PlainLiteral .

api:RdfXmlFormatter a rdfs:Class ;
  rdfs:label "RDF/XML Formatter"@en ;
  rdfs:comment "A formatter that generates an RDF/XML representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:rdfXmlFormatter a api:RdfXmlFormatter ;
  rdfs:label "Default RDF/XML Formatter"@en ;
  rdfs:comment "A formatter that gives the default RDF/XML representation of an RDF graph"@en ;

api:TurtleFormatter a rdfs:Class ;
  rdfs:label "Turtle Formatter"@en ;
  rdfs:comment "A formatter that generates an Turtle representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:TurtleFormatter a api:TurtleFormatter ;
  rdfs:label "Default Turtle Formatter"@en ;
  rdfs:comment "A formatter that gives the default Turtle representation of an RDF graph"@en ;

api:JsonFormatter a rdfs:Class ;
  rdfs:label "JSON Formatter"@en ;
  rdfs:comment "A formatter that generates a simple JSON representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:jsonFormatter a api:jsonFormatter ;
  rdfs:label "Default JSON Formatter"@en ;
  rdfs:comment "A formatter that gives the default simple JSON representation of an RDF graph"@en ;

api:XmlFormatter a rdfs:Class ;
  rdfs:label "XML Formatter"@en ;
  rdfs:comment "A formatter that generates a simple XML representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:xmlFormatter a api:xmlFormatter ;
  rdfs:label "Default XML Formatter"@en ;
  rdfs:comment "A formatter that gives the default simple XML representation of an RDF graph"@en ;

api:CsvFormatter a rdfs:Class ;
  rdfs:label "CSV Formatter"@en ;
  rdfs:comment "A formatter that generates a simple CSV representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:csvFormatter a api:csvFormatter ;
  rdfs:label "Default CSV Formatter"@en ;
  rdfs:comment "A formatter that gives the default simple CSV representation of an RDF graph"@en ;

api:XsltFormatter a rdfs:Class ;
  rdfs:label "XSLT Formatter"@en ;
  rdfs:comment "A formatter that uses an XSLT stylesheet to generates a representation of an RDF graph"@en ;
  rdfs:subClassOf api:Formatter .

api:stylesheet a rdf:Property ;
  rdfs:label "Stylesheet"@en ;
  rdfs:comment "The XSLT stylesheet that should be used by an XSLT formatter to generate a representation of the RDF graph"@en ;
  rdfs:domain api:XsltFormatter ;
  rdfs:range rdfs:Resource .
```