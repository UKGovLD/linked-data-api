[Go to Summary and Contents](Specification.md)

# Binding Variables #

Variables are used to alter the behaviour of specific components, e.g. to support paging and sorting, as well as to inject values into SPARQL queries. The API supports binding of variables from a number of different places including the API configuration and the request parameters.

Variables are bound based on (in order):

  1. variable declarations at the API level
  1. URI template matching
  1. request parameter bindings
  1. variable declarations at the endpoint level
  1. the binding of the `item` variable within an item endpoint

A variable binding consists of a **variable name** and a **variable value** which may be any kind of RDF resource (including a typed literal or a value with a language).

Variables can be declared explicitly at either the API level or the endpoint level. Within the configuration, a variable binding is created using a `api:Variable` resource, which can have the properties `api:name`, `api:value`, `api:type` and `api:lang`. The variable's value is determined by substituting any occurrences of `{varName}` within the value of the `api:value` with the value of the named variable from the existing set of variable bindings. The datatype or language of the variable's value is supplied through the `api:type` or `api:lang` property. It is possible for variables to depend on each other so long as this does not result in a circular dependency; endpoint-level variables can also depend on API-level variables, but not vice versa.

When the endpoint specifies a `api:uriTemplate`, the process of matching against the URI template creates some additional variable bindings, which override those specified at the API level. Within the endpoint path template, any **path segments** (parts of the path delimited by "**/**"s - see [Uniform Resource Identifiers (URI): Generic Syntax](http://www.ietf.org/rfc/rfc2396.txt)) that are of the form `{varName}` create a variable binding with the name `varName` and a plain literal value that is the path segment from the request URI. Within the endpoint parameter templates, any endpoint parameter template values of the form `{varName}` create a variable binding with the name `varName` and a plain literal value that is the request parameter value from the request parameter whose name is the same as the endpoint parameter template name.

All unreserved request parameters (ie those except `callback` and any parameter that begins with an underscore) are mapped directly into variable bindings, and override any variable bindings specified at the API level or through matching against the URI template. If there is a request parameter of the form `lang-{parameter}` then the value of the variable is an RDF literal with the language specified by that request parameter. Otherwise, the value is a plain literal.

In an item endpoint, the value of the `api:itemTemplate` property creates a variable binding with the name `item`. Its value is a resource whose URI is constructed by taking the value of the `api:itemTemplate` and replacing any `{varName}` within it with the string value of the named variable. Note that this `item` variable overrides any other binding of the `item` variable.

## Examples ##

With the following configuration:

```
<http://education.data.gov.uk/api> a api:API
  ...
  api:variable [
    api:name "base" ;
    api:value "http://education.data.gov.uk/id" ;
  ], [
    api:name "areaBase" ;
    api:value "http://statistics.data.gov.uk/id" ;
  ], [
    api:name "england" ;
    api:value "{areaBase}/country/921" ;
    api:type rdfs:Resource ;
  ] ;
  ...
  api:endpoint [
    api:uriTemplate "school/{identifier}" ;
    api:itemTemplate "{base}/school/{identifier}" ;
    api:variable [
      api:name "school" ;
      api:value "{base}/school/{identifier}"
      api:type rdfs:Resource ;
    ], [
      api:name "schoolNumber" ;
      api:value "{identifier}" ;
      api:type xsd:integer ;
    ]
    ...
  ]
```

The request `doc/school/12345?localAuthority.code=00BX&phaseOfEducation.label=Primary&lang-phaseOfEducation.label=en&_view=detailed` causes the following variable bindings:

  * `base = "http://education.data.gov.uk/id"`
  * `areaBase = "http://statistics.data.gov.uk/id"`
  * `england = <http://statistics.data.gov.uk/id/country/921>`
  * `identifier = "12345"`
  * `localAuthority.code = "00BX"`
  * `phaseOfEducation.label = "Primary"@en`
  * `school = <http://education.data.gov.uk/id/school/12345>`
  * `schoolNumber = 12345`
  * `item = <http://education.data.gov.uk/id/school/12345>`