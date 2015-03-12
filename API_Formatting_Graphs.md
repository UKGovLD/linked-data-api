[Go to Summary and Contents](Specification.md)



# Formatting Graphs #

The representation that is finally returned for a request is determined by a Formatter.

An API may have a number of formatters available for generating responses for a request. Clients may choose from amongst these formatters using content negotiation.

## Built-In Formatters ##

This specification defines five types of "built-in" Formatters that produce outputs in a range of different serialisations.

Conforming implementations MUST support the RDF and JSON formatters and SHOULD support the additional formatters in order to provide clients with additional flexibility in quering an API.

The XSLT Formatter provides a built-in extension point for supporting a range of additional serializations through transformation of the simple XML format.

The following table identifies the five built in formatters. Each formatter is listed along with its name, its URI, the mimetype it generates, and whether implementations are required to support it:

| Description | Name | URI | Mimetype | Required? |
|:------------|:-----|:----|:---------|:----------|
| RDF Formatter | `rdf` | `api:RdfXmlFormatter` |`application/rdf+xml`| Yes |
| JSON Formatter | `json` | `api:JsonFormatter` |`application/json`| Yes |
| Turtle Formatter | `ttl` | `api:TurtleFormatter` | `text/turtle` | No |
| XML Formatter | `xml` | `api:XmlFormatter` | `application/xml` | No |
| XSLT Formatter | N/A  | `api:XsltFormatter` | N/A | No |

The XSLT Formatter does not specify a name or a mimetype. Instances of that formatter are intended to be configured with a name and mimetype appropriate to the XSLT stylesheet used to serialize the results.

Implementations may support other formatter types, or support additional configuration of the built-in formatter types through implementation-specific properties as long as their basic behaviours remain unchanged.

## Formatter Configuration ##

For a request to an endpoint, the list of possible formatters is constructed from:

  * the built-in formatters supported by the API implementation
  * the `api:defaultFormatter` property on the API
  * the `api:formatter` property on the API
  * the `api:defaultFormatter` property on the selected endpoint
  * the `api:formatter` property on the selected endpoint

Two formatters may have the same name, indicated by the `api:name` property. A formatter lower in this list overrides the one from higher in the list.

For example a `'json'` formatter defined on an Endpoint will override the built-in `'json'` formatter.

## Formatter Selection ##

The formatter that is to be used when producing results from a request is determined as follows:

  * if the `_format` request parameter is specified, and the API's `api:contentNegotiation` property is `api:parameterBased`, the formatter named in that parameter. If there is no such formatter, a `400 Bad Request` response is given.
  * otherwise, if the last path segment in the request URI uses an extension, such as `.ttl`, the formatter name is the one given after the final dot in that path segment. If there is no such formatter, continue (note that in this case the suffix will not be stripped from the request path prior to matching against endpoint URIs).
  * otherwise, use the `Accept` header in the request to perform content negotiation based on the `api:mimeType` properties of the available formatters
  * otherwise, if the endpoint contains a `api:defaultFormatter`, use that
  * otherwise, if the API contains a `api:defaultFormatter`, use that
  * otherwise use the `api:jsonFormatter`

## Formatter Inputs ##

A Formatter component is passed the following logical parameters when executed:

  * the RDF graph constructed by the viewer
  * the URI of the root resource in the graph: in the case of an item endpoint, this is the item itself; in the case of a list endpoint, it is the current page
  * the variable bindings, as described above
  * the prefix bindings present within the configuration file

Implementations are free to pass these parameters to the formatter in whatever manner is best suited. Additional parameters or context can also be made available.

# Output Formats #

## RDF/XML Formatting ##

RDF/XML formatters should create [RDF/XML](http://www.w3.org/TR/rdf-syntax-grammar/).

They should use the prefix bindings that they are passed as namespace declarations within the RDF/XML.

### Example Document ###

The "Viewing Resources" section of the specification includes a [worked example for a list endpoint](http://code.google.com/p/linked-data-api/wiki/API_Viewing_Resources#List_Endpoint) that uses the Turtle syntax. Continuing that example, an RDF/XML Formatter would serialize that graph as RDF/XML, applying the available prefix bindings.

The following document illustrates on possible serialization of that example graph:

```
<?xml version="1.0" encoding="utf-8"?>
<rdf:RDF
   xmlns:api="http://purl.org/linked-data/api/vocab#"
   xmlns:dct="http://purl.org/dc/terms/"
   xmlns:foaf="http://xmlns.com/foaf/0.1/"
   xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/"
   xmlns:owl="http://www.w3.org/2002/07/owl#"
   xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
   xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
   xmlns:xhv="http://www.w3.org/1999/xhtml/vocab#"
   xmlns:xsd="http://www.w3.org/2001/XMLSchema#">
  <api:List rdf:about="http://api.example.org/people">
    <dct:hasPart rdf:resource="http://api.example.org/people?_page=0"/>
    <api:definition rdf:resource="http://api.example.org/spec/people"/>
    <rdfs:label xml:lang="en">List of people</rdfs:label>
  </api:List>
  <api:Page rdf:about="http://api.example.org/people?_page=0">
    <opensearch:itemsPerPage rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">10</opensearch:itemsPerPage>
    <opensearch:startIndex rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">1</opensearch:startIndex>
    <dct:hasFormat rdf:resource="http://api.example.org/people.json?_page=0&amp;_view=default"/>
    <dct:hasFormat rdf:resource="http://api.example.org/people.rdf?_page=0&amp;_view=default"/>
    <dct:hasFormat rdf:resource="http://api.example.org/people.ttl?_page=0&amp;_view=default"/>
    <dct:isPartOf rdf:resource="http://api.example.org/people"/>
    <api:items rdf:parseType="Collection">
      <rdf:Description rdf:resource="http://people.example.org/bob"/>
      <rdf:Description rdf:resource="http://people.example.org/mary"/>
    </api:items>
    <xhv:next rdf:resource="http://api.example.org/people?_page=1"/>
    <rdfs:label xml:lang="en">First page of the list of people</rdfs:label>
    <owl:sameAs rdf:resource="http://api.example.org/people?_page=0&amp;_view=default"/>
  </api:Page>
  <foaf:Person rdf:about="http://people.example.org/bob">
    <foaf:name>Bob</foaf:name>
  </foaf:Person>
  <foaf:Person rdf:about="http://people.example.org/mary">
    <foaf:name>Mary</foaf:name>
  </foaf:Person>
  <rdf:Description rdf:about="http://api.example.org/people.json?_page=0&amp;_view=default">
    <dct:format>
      <rdf:Description>
        <rdfs:label>application/json</rdfs:label>
      </rdf:Description>
    </dct:format>
    <dct:isFormatOf rdf:resource="http://api.example.org/people?_page=0&amp;_view=default"/>
    <rdfs:label xml:lang="en">JSON format of the default view of the first page of the list of people</rdfs:label>
  </rdf:Description>
  <rdf:Description rdf:about="http://api.example.org/people.rdf?_page=0&amp;_view=default">
    <dct:format>
      <rdf:Description>
        <rdfs:label>application/rdf+xml</rdfs:label>
      </rdf:Description>
    </dct:format>
    <dct:isFormatOf rdf:resource="http://api.example.org/people?_page=0&amp;_view=default"/>
    <rdfs:label xml:lang="en">RDF/XML format of the default view of the first page of the list of people</rdfs:label>
  </rdf:Description>
  <rdf:Description rdf:about="http://api.example.org/people.ttl?_page=0&amp;_view=default">
    <dct:format>
      <rdf:Description>
        <rdfs:label>text/turtle</rdfs:label>
      </rdf:Description>
    </dct:format>
    <dct:isFormatOf rdf:resource="http://api.example.org/people?_page=0&amp;_view=default"/>
    <xhv:next rdf:resource="http://api.example.org/people.ttl?_page=1&amp;_view=default"/>
    <rdfs:label xml:lang="en">Turtle format of the default view of the first page of the list of people</rdfs:label>
  </rdf:Description>
</rdf:RDF>
```

## Turtle Formatting ##

Turtle formatters should create [Turtle](http://www.w3.org/TeamSubmission/turtle/).

They should use the prefix bindings that they are passed as prefix declarations within the Turtle.

### Example Document ###

The "Viewing Resources" section of the specification includes a [worked example for a list endpoint](http://code.google.com/p/linked-data-api/wiki/API_Viewing_Resources#List_Endpoint) that uses the Turtle syntax. Continuing that example, a Turtle Formatter would serialize that graph, applying the available prefix bindings.

## JSON Formatting ##

The JSON formatter creates a simple JSON format based on the RDF graph that it is provided.

### JSON Structure ###

The result is a single JSON object, that has the following basic structure:

```
{
  "format": "linked-data-api" ;
  "version": "0.2" ;
  "result": {
    ...
  }
}
```

The object has three properties:

  * `format`: a fixed string that identifies this JSON structure as conforming to the JSON format described in this specification
  * `version`: a string version indicator tied to the version of this document
  * `result`: a JSON object that is the main entry point into the returned data.

### Serialization Algorithm ###

When serialising into JSON the JSON Formatter should first identify the `api:Page` resource in the provided RDF graph. This resource will be serialized as the value of the `result` property in the JSON response.

After locating the resource the implementation should iterate through its properties, applying the following rules for serializing objects that are resources and literals.

This results in a traversal of the graph, touching each resource that is connected to the `api:Page` resource. This will include

  * the `api:List` (via the `dct:isPartOf` property)
  * the selected items and any resources that they reference (via the `api:items`) property
  * the available alternate formats and versions (via `dct:hasFormat` and `dct:hasVersion` properties)

Implementations should detect loops and for any resource that has already been visited in the graph, simply serialize its URI.

Any resources that are not reachable from the `api:Page` resource, or resources to which it can be related, will not be included in the output.

#### Mapping RDF Property URIs to JSON Object Properties ####

The RDF properties of a resource are mapped onto JSON properties. The name of the JSON property is:

  * the short name for the property, as described in the property paths section, if it has one
  * the `rdfs:label` of the property, if it is a legal short name for a property that doesn't clash with an existing name
  * the local name of the property (the part after the last hash or slash), if it is a legal short name for a property that doesn't clash with an existing name
  * the prefix associated with the namespace of the property (the part before the last hash or slash), concatenated with an underscore, concatenated with the local name of the property

#### Serializing Resources ####

RDF resources are either mapped onto JSON objects or simple string values depending on the amount of detail available about the resource in the graph being serialized.

The reserved property `_about` is used to serialize the URI of a resource.

  * if the resource has a URI, and is not the subject of any other statements in the graph then it is mapped onto a string whose value is the URI of the resource
  * otherwise, if the resource has a URI, and is the subject of statements in the RDF graph, it is mapped onto a JSON object as described here. The object is given an `_about` property that contains the URI of the resource
  * otherwise, if the value is a blank node with no properties it is mapped onto a JSON object with no properties
  * if the resource is a blank node that is the object or more than one statement within the graph, the object is given a `_id` property that contains a unique identifier for that blank node
  * otherwise, if the value is a `rdf:List`, it is mapped to an array whose items are the result of mapping the members of the list to JSON

#### Serializing Literals ####

Where possible literal values are mapped onto simple JSON literals or types.

The value of the JSON property is an array if the RDF property has more than one value in the RDF graph or if the `api:multiValued` property of the RDF property has the value `true`.

Each RDF literal is mapped onto a JSON value as follows:

  * if the `api:structured` property of the RDF property has the value `true` then the value is represented as an object with a `_value` property holding the value itself, and `_lang` or `_datatype` properties holding the language code and the short name of the datatype as applicable
  * otherwise, if the value has a datatype of `xsd:boolean`, it becomes `true` or `false`
  * otherwise, if the value has a numeric datatype (one of the XML Schema numeric datatypes), it becomes a number in the JSON
  * otherwise, if the value has the datatype `xsd:dateTime` it is mapped to a string in the date/time format recognised by `Date.parse`, namely `EEE, d MMM yyyy HH:mm:ss 'GMT'Z`
  * otherwise, if the value has the datatype `xsd:date` it is mapped to a string in the date format recognised by `Date.parse`, namely `yyyy-MM-dd`
  * otherwise, if the JSON property is an array (because the RDF property has multiple values or is marked as multi-valued) then the value is represented as a string; if the value has a language then `@{lang}` is appended to the string; if the value has a datatype then `^^{datatype}` is appended to the string
  * otherwise (the value is a literal that isn't a boolean or number), it is mapped onto a string

Note: if a literal has a language, but is not marked as a being an `api:structured` value, then it is mapped to a string, i.e. the language is lost in the serialization

Note: if the literal has a datatype, that is not an `xsd:dateTime`, `xsd:boolean`, or a number, but is not marked as being an `api:structured` value, then it is mapped to a string.

Therefore this serialization of RDF to JSON is lossy. A trade-off is being made to provide a simple JSON format vs encompassing the full RDF model. Flexibility is provided to allow data publishers to preserve this data, as the cost of more complex JSON structures.

### JSONP ###

Implementations may provide a [JSONP](http://en.wikipedia.org/wiki/JSON#JSONP) option, whereby, if the `callback` request parameter is present, its value is a valid Javascript function name (matching the regular expression `/^[a-zA-Z_][a-zA-Z0-9]*$/`), and the JSON Formatter is being used, the body of the response should consist of a line of Javascript calling the function named in the `callback` parameter, with the JSON object as the argument of that function.

Eg:

If the request URI is:
`/schools.json?callback=showSchoolsOnMap`

The response body should be:

`showSchoolsOnMap({})`


(`{}` here, for the sake of brevity, represents the full JSON object, as described above, and detailed below. )

If the callback is not a valid function name, a `400 Bad Request` should be returned.



### Example Document ###

The "Viewing Resources" section of the specification includes a [worked example for a list endpoint](http://code.google.com/p/linked-data-api/wiki/API_Viewing_Resources#List_Endpoint) that uses the Turtle syntax.

The default JSON Formatter would serialize that graph into the following JSON document:

```
{
    "format": "linked-data-api" ,
    "version": "0.2" ,
    "result": {
        "_about": "http://api.example.org/people?_page=0",
        "type": "http://purl.org/linked-data/api/vocab#Page",
        "itemsPerPage": 10,
        "startIndex": 1,
        "items": [
            {
                "_about": "http://people.example.org/bob",
                "type": "http://xmlns.com/foaf/0.1/Person",
                "name": "Bob" 
            },
            {
                "_about": "http://people.example.org/mary",
                "type": "http://xmlns.com/foaf/0.1/Person",
                "name": "Mary" 
            } 
        ],
        "label": "First page of the list of people",
        "isPartOf": {
            "_about": "http://api.example.org/people",
            "type": "http://purl.org/linked-data/api/vocab#List",
            "label": "List of people",
            "definition": "http://api.example.org/spec/people",
            "hasPart": "http://api.example.org/people?_page=0" 
        },
        "sameAs": "http://api.example.org/people?_page=0&_view=default",
        "hasFormat": [
            {
                "_about": "http://api.example.org/people.ttl?_page=0&_view=default",
                "label": "Turtle format of the default view of the first page of the list of people",
                "format": {
                    "label": "text/turtle"
                },
                "isFormatOf": "http://api.example.org/people?_page=0&_view=default",
                "next": "http://api.example.org/people.ttl?_page=1&_view=default"  
            },
            {
                "_about": "http://api.example.org/people.json?_page=0&_view=default",
                "label": "JSON format of the default view of the first page of the list of people",
                "format": {
                    "label":"application/json" 
                },
                "isFormatOf": "http://api.example.org/people?_page=0&_view=default",
                "next": "http://api.example.org/people.json?_page=1&_view=default"  
            },
            {
                "_about": "http://api.example.org/people.rdf?_page=0&_view=default",
                "label": "RDF/XML format of the default view of the first page of the list of people",
                "format": {
                    "label": "application/rdf+xml"
                },
                "isFormatOf": "http://api.example.org/people?_page=0&_view=default",
                "next": "http://api.example.org/people.rdf?_page=1&_view=default"   
            } 
        ],
        "next": "http://api.example.org/people?_page=1" 
    }
}
```

## XML Formatting ##

The XML formatter creates an XML representation that is very similar to the JSON representation. The outermost object is a `<result>` element with `format` and `version` attributes.

The resource described in the `<result>` element is the entry point into the graph, as described above (the item for an item endpoint, the page for a list endpoint).

Resources are mapped onto XML elements as follows:

  * if the resource is a blank node that is the object or more than one statement within the graph, the element is given a `id` attribute that contains a unique identifier for that blank node
  * otherwise, if the resource is not a blank node, the element is given an `href` attribute that contains the URI of the resource

The RDF properties of a resource are mapped onto XML elements. The name of the XML element is:

  * the short name for the property, as described in the property paths section, if it has one
  * the `rdfs:label` of the property, if it is a legal short name for a property that doesn't clash with an existing name
  * the local name of the property (the part after the last hash or slash), if it is a legal short name for a property that doesn't clash with an existing name
  * the prefix associated with the namespace of the property (the part before the last hash or slash), concatenated with an underscore, concatenated with the local name of the property

The contents of the XML element is a sequence of `<item>` elements if the RDF property has more than one value in the RDF graph or if the `api:multiValued` property of the RDF property has the value `true`.

Each RDF value is mapped onto some XML content as follows:

  * if the value is a literal, it is mapped to a text node holding the value itself; `lang` or `datatype` attributes on the element hold the language code and the short name of the datatype as applicable
  * otherwise, if the value is a `rdf:List`, it is mapped to a sequence of `<item>` elements, one representing each of the results of mapping the members of the list to XML
  * otherwise, if the value is a resource which is the subject of a statement in the RDF graph, it is mapped onto an XML element as described here
  * otherwise, if the value is a blank node with no properties it is mapped onto an empty XML element (with an `id` attribute if it it referenced more than once)
  * otherwise, if the value is a resource the element is given an `href` attribute whose value is the URI of the resource

## XSLT Formatting ##

XSLT formatters create representations by taking the simple XML generated by the default XML formatter (`api:xmlFormatter`) and transforming it using the stylesheet specified by the `api:stylesheet` property of the XSLT formatter.

The XSLT stylesheet is passed an `$api:namespaces` parameter which contains an XML document in the format:

```
<namespaces>
  <namespace prefix="{prefix}">{value}</namespace>
  ... other namespaces ...
</namespaces>
```

It is also passed a parameter for each of the variable bindings, with the name equal to the variable name and the value being the string value of the variable.