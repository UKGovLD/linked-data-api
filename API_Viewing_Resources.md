[Go to Summary and Contents](Specification.md)



# Viewing Resources #

Having selected the resources of interest, some or all of the properties of those resources must be retrieved from the configured SPARQL endpoint to construct an RDF graph. This is done by selecting a **Viewer** that is used to construct an RDF graph for each item in the sequence. The relevant viewer is selected as follows:

  * if there is a `_view` request parameter, then matching that to the `api:name` of a viewer that is specified through the `api:viewer` property on the endpoint or the `api:viewer` property on the API. If the `_view` request parameter is present, but there is no viewer with that name, the result is a `400 Bad Request` error.
  * otherwise, if the endpoint has a `api:defaultViewer` property, the viewer specified by that property
  * otherwise, if the API has a `api:defaultViewer` property, the viewer specified by that property
  * otherwise, the `api:describeViewer` viewer, which is built in

The API supports a set of built-in viewers and also the ability to create specialised, custom viewers to support specific use cases.

## Built-in Viewers ##

The following viewers are built in to the API.

`api:describeViewer` is named "description" and returns a graph that is exactly what is returned by a DESCRIBE query for the item on the SPARQL endpoint. How the SPARQL endpoint implements DESCRIBE will determine exactly what is returned (it may be a concise bounded description, for example).

`api:labelledDescribeViewer` is named "all" and returns a graph that is whatever is returned by a DESCRIBE query for the item on the SPARQL endpoint, supplemented by `rdfs:label` properties for all referenced resources. Again, the precise details of what's returned will depend on the SPARQL endpoint.

`api:basicViewer` is named "basic" and returns a graph that includes just the `rdfs:label` and `rdf:type` of each item. This is equivalent to:

```
api:basicViewer a api:Viewer ;
  api:name "basic" ;
  api:property rdfs:label, rdf:type .
```

## Specialised Viewers ##

Specialised viewers need to create a graph for each item.

A viewer may include other viewers through its `api:include` property. In that case, the graph will include the properties specified by the included viewers as well as those specified locally on the viewer itself.

The graph can be constructed explicitly using SPARQL syntax (specifically  [ConstructTriples](http://www.w3.org/TR/rdf-sparql-query/#rConstructTriples)) within:

  * the `_template` request parameter or
  * the `api:template` property on the viewer

If neither of these are specified, the viewer must specify the properties that are included in the graph for each item, and the properties of the resources that these items reference and so on. In other words, a viewer needs to specify a set of property chains.

The set of property chains is constructed by combining:

  * the property chains specified in the `_properties` request parameter
  * the property chains specified in the `api:properties` property of the viewer
  * the properties specified with the `api:property` properties of the viewer

The `api:property` property should point to either individual instances of `rdf:Property` or `rdf:List`s whose items are all instances of `rdf:Property`.

Similar `rdf:List`s can be created from the value of the `_properties` request parameter or `api:properties` property. These are created by first splitting the value based on commas. The individual values should be property paths. These property paths can be split on dots, each short property name mapped to an `rdf:Property`, and these used to create a list of properties.

Each property chain can be used to identify a particular property within the graph by navigating from the selected item through the properties in the chain. All triples en route to the final property are included, even if there is no final property. For example, given the source graph:

```
<http://education.data.gov.uk/id/school/12345>
  a sch:School ;
  sch:localAuthority <http://statistics.data.gov.uk/id/local-authority/00BX> .

<http://statistics.data.gov.uk/id/local-authority/00BX>
  a admin:UnitaryAuthority ;
  rdfs:label "Knowsley Borough Council"@en ;
  admin:area <http://statistics.data.gov.uk/id/local-authority-area/00BX> .

<http://statistics.data.gov.uk/id/local-authority-area/00BX>
  a admin:UnitaryAuthorityArea ;
  rdfs:label "Knowsley"@en ;
  admin:country <http://statistics.data.gov.uk/id/country/921> .

<http://statistics.data.gov.uk/id/country/921>
  a admin:Country ;
  rdfs:label "England"@en .
```

Where the school is the item, the property chains:

```
(rdf:type)
(sch:localAuthority admin:area rdfs:label)
(sch:localAuthority admin:area admin:country stats:population)
```

would result in the graph:

```
<http://education.data.gov.uk/id/school/12345>
  a sch:School ;
  sch:localAuthority <http://statistics.data.gov.uk/id/local-authority/00BX> .

<http://statistics.data.gov.uk/id/local-authority/00BX>
  admin:area <http://statistics.data.gov.uk/id/local-authority-area/00BX> .

<http://statistics.data.gov.uk/id/local-authority-area/00BX>
  rdfs:label "Knowsley"@en ;
  admin:country <http://statistics.data.gov.uk/id/country/921> .
```

which includes the `admin:country` property of the local authority area despite the source graph not including the `stats:population` property for the country.

The values that are included in the view may be filtered by language. The list of included languages is provided in a comma-separated list by the first of:

  * the `_lang` request parameter
  * the `Accept-Language` HTTP header
  * the `api:lang` property on the Endpoint
  * the `api:lang` property on the API

If the list is empty (because none of these is specified) then values in all languages are included in the view. If some included languages are provided, then the values that are included are:

  * those with one of the specified languages
  * if no value with a specified language is present, any plain literals (without language or datatype)

# Additional Graph Metadata #

In addition to the graph generated by the selection and viewing of resources from the underlying SPARQL endpoint, the result graph contains an number of additional items of information.

The additional properties and structure of the graph varies depending on whether the Endpoint servicing a request is a list endpoint or an item endpoint. A number of common properties are also included

## Common Properties ##

Both item and list endpoints should include the following statements for the page:

  * `dct:hasVersion`/`dct:isVersionOf` links to/from URIs that will provide different views of the selected items (ie with different values of the `_view` parameter)
  * `dct:hasFormat`/`dct:isFormatOf` links to/from URIs that specify the different formats of the page, using either a suffix on the URI or a `_format` URI parameter, depending on the `api:contentNegotiation` property on the API

The alternate versions and formats should all have an `rdfs:label` property that provides a human-readable description of the specific format and/or version. See the worked example for an illustration.

## List Metadata ##

For a list endpoint, the additional metadata provides:

  * a description of the `api:List` whose `api:Page` has been retrieved
  * additional information about the structure of the `api:Page`

### List Description ###

Every `api:Page` resource is part of a `api:List`. A basic description of that list, including a label and a pointer to its definition should be included in the graph. The relationshp between the List and the Page should also be included:

The URI for the List is the same as the request URI after removing the `_page` URI parameter, if there is one. The following statements should then be made about the List:

  * a `rdf:type` statement stating that the list is an `api:List`
  * the `api:definition` property provides a link between an `api:List` and the specification of the API Endpoint
  * an `rdfs:label` that describes the List
  * a `dct:hasPart` relation that associates the List with the Page being retrieved

### Page Description ###

The URI for the Page is the same as the request URI, with the `_page` parameter set to the current page. This resource should already exist in the graph, having an `api:items` property that references an `rdf:List` containing the selected items, in order

The following statements should then be made about the Page:

  * a `rdf:type` statement stating that the page is an `api:Page`
  * a `dct:hasPart` relation from the Page to the List
  * a `xhv:first` link from the page to the first page
  * a `xhv:last` link from the page to the last page, if this is identifiable
  * a `xhv:next` link from the page to the next page, if there is one
  * a `xhv:prev` link from the page to the previous page, if there is one
  * a `openSearch:itemsPerPage` property on the page indicating the LIMIT used to select the items
  * a `openSearch:startIndex` property on the page indicating the OFFSET used to select the items

## Item Metadata ##

For an item endpoint, this metadata should include:

  * a `foaf:primaryTopic` link from the request URI to the item
  * a `foaf:isPrimaryTopicOf` link from the item to the request URI

TODO: expand on this

## Addtional Metadata ##

TODO: expand on this

The graph should also include:

  * statements from the SPARQL endpoint about the list or page, including a full description of the objects of such statements
  * statements from the configuration about the list or page, including a full descriptions of the objects of such statements
  * statements within a named graph accessible at the SPARQL endpoint whose URI is the same as the item (when viewing a single item), list or page

## Worked Example ##

The following sections include examples that assume that a trivial API has been deployed for a dataset that includes the following data:

```
<http://people.example.org/bob>
   a foaf:Person ;
   foaf:name "Bob".

<http://people.example.org/mary>
   a foaf:Person ;
   foaf:name "Mary".
```

### List Endpoint ###

A List endpoint at the API has been configured that will list all resources of type `foaf:Person`.

The API supports output in RDF, JSON and Turtle.

In addition there are two views: a default view and a "full" view.

#### Result Graph ####

The initial processing steps (selection and then viewing of the resources), produces a list of people that is described by the following graph:

```
<http://api.example.org/people?_page=0>
  api:items ( <http://people.example.org/bob> <http://people.example.org/mary> )
  .

<http://people.example.org/bob>
   a foaf:Person ;
   foaf:name "Bob".

<http://people.example.org/mary>
   a foaf:Person ;
   foaf:name "Mary".
```

This graph, which has been generated for a List of items is then supplemented to add in the Common Properties and the List Metadata described in the above sections.

#### Final Graph ####

The final graph, which is shown below, includes a more detailed description of the page, a description of the List, as well as descriptions of all available formats and versions:

```

In this example the user has requested a Turtle representation.

@prefix api: <http://purl.org/linked-data/api/vocab#>.
@prefix dct: <http://purl.org/dc/terms/>.
@prefix foaf: <http://xmlns.com/foaf/0.1/>.
@prefix opensearch: <http://a9.com/-/spec/opensearch/1.1/>.
@prefix owl:     <http://www.w3.org/2002/07/owl#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xhv: <http://www.w3.org/1999/xhtml/vocab#>.
@prefix xsd:     <http://www.w3.org/2001/XMLSchema#> .

<http://api.example.org/people>
 a api:List ;
 rdfs:label "List of people"@en ;
 api:definition <http://api.example.org/spec/people> ;
 dct:hasPart <http://api.example.org/people?_page=0>
 .

<http://api.example.org/people?_page=0>
 a api:Page ;
 opensearch:itemsPerPage 10;
 opensearch:startIndex 1;
 api:items ( <http://people.example.org/bob> <http://people.example.org/mary> ) ;
 rdfs:label "First page of the list of people"@en ;
 dct:isPartOf
   <http://api.example.org/people> ;
 owl:sameAs
   <http://api.example.org/people?_page=0&_view=default> ;
 dct:hasFormat
   <http://api.example.org/people.ttl?_page=0&_view=default> ,
   <http://api.example.org/people.json?_page=0&_view=default> ,
   <http://api.example.org/people.rdf?_page=0&_view=default> ;
 xhv:next
   <http://api.example.org/people?_page=1> .

<http://people.example.org/bob>
   a foaf:Person ;
   foaf:name "Bob".

<http://people.example.org/mary>
   a foaf:Person ;
   foaf:name "Mary".

<http://api.example.org/people.ttl?_page=0&_view=default>
 rdfs:label "Turtle format of the default view of the first page of the list of people"@en ;
 dct:format [ rdfs:label "text/turtle" ];
 dct:isFormatOf
   <http://api.example.org/people?_page=0&_view=default> ;
 xhv:next
   <http://api.example.org/people.ttl?_page=1&_view=default> .

<http://api.example.org/people.json?_page=0&_view=default>
 rdfs:label "JSON format of the default view of the first page of the list of people"@en ;
 dct:format [ rdfs:label "application/json" ];
 dct:isFormatOf
   <http://api.example.org/people?_page=0&_view=default>.

<http://api.example.org/people.rdf?_page=0&_view=default>
 rdfs:label "RDF/XML format of the default view of the first page of the list of people"@en ;
 dct:format [ rdfs:label "application/rdf+xml" ];
 dct:isFormatOf
   <http://api.example.org/people?_page=0&_view=default> .
```