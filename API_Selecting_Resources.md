[Go to Summary and Contents](Specification.md)

## Selecting Resources ##

Having identified an Endpoint and having identified and bound all the in-scope variables, the next processing step is to select zero or more resources from the SPARQL endpoint. These resources will act as input to further processing steps (Viewing and Formatting).

There are two different types of Endpoint:

  * An **Item Endpoint** selects a single resource which is identified by the in-scope `item` variable. This is typically generated using an Item Template.
  * A **List Endpoint** selects zero or more resources based on a query made to the configured SPARQL endpoint.

For List Endpoints the query to be executed may be explicitly defined or assembled based on a declarative description of the desired behaviour. In both cases the following aspects of query are always automatically constructed:

  * the set of namespace prefixes, which is the same as those in the configuration file (or the in-scope prefixes if the configuration is not loaded from a file)
  * the LIMIT and OFFSET clauses, to support automatic paging

The query itself is a [SELECT query](http://www.w3.org/TR/rdf-sparql-query/#select) based on a combination of the request parameters and the **selector** associated with the endpoint through the `api:selector` property. The query can be specified directly or constructed automatically.

Paginated is supported by adding an OFFSET clause based on the `_page` request parameter, if present (otherwise no OFFSET clause is added) and a LIMIT clause with the value:

  * of the `api:maxPageSize` of the API if the `_pageSize` parameter is present and exceeds that value
  * otherwise, the `_pageSize` request parameter, if present
  * otherwise, the `api:defaultPageSize` property of the endpoint, if present
  * otherwise, the `api:defaultPageSize` property of the API, if present
  * otherwise, 10

### Selection Based on Explicit Query ###

A query may be explicitly defined using:

  * a `_select` request parameter, if present
  * otherwise, a `api:select` property of the selector

Both of these must contain a SELECT query, including the SELECT clause itself.

In this case, the variable bindings are used to replace SPARQL variable references within the pattern (any `?varName`) with one of:

  * `<varValue>` if the variable is of type rdfs:Resource or
  * `"varValue"^^varType` if the variable is of a specific datatype or
  * `"varValue"@varLang` if the variable has a specific language or
  * `"varValue"` if the variable is a plain literal

Note that this may leave some variables within the SPARQL query; that's fine.

### Selection Based on a Constructed Query ###

If the query is not specified directly it is constructed in two parts: the filtering of resources and the ordering of those resources. The final SELECT query used to construct the list of resources is constructed as:

```
SELECT ?item
WHERE {
  filter
}
ORDER BY order
```

Note that the order specification may also involve adding filters to the WHERE clause.

#### Filters ####

Resources are filtered based on a [GroupGraphPattern](http://www.w3.org/TR/rdf-sparql-query/#rGroupGraphPattern) constructed by combining:

  * the `_where` request parameter
  * the unreserved request parameters (any parameter except 'callback' and those that begin with an underscore )
  * the `api:where` property of the selector
  * the `api:filter` property of the selector
  * the filters specified by the ancestors of the selector, as identified through the `api:parent` property; implementations should issue a warning if the parent selects its items through an explicit query as opposed to using filters

If none of these are present, the GroupGraphPattern is `{ ?item ?property ?value }`. If several are present, they are combined (this includes filters specified through `api:where` and `api:filter`).

The GroupGraphPattern must contain a binding for the `?item` variable. This indicates the items that are selected.

The `_where` and `api:where` properties hold SPARQL syntax directly, and can be simply concatentated into the GroupGraphPattern. Variable bindings are replaced as described above for the `api:select` property.

The `api:filter` property should be turned into a set of parameter bindings as if it were a URI query string. Any values that follow the pattern `{varName}` should be replaced by the value of that variable.

The set of parameter bindings from the `api:filter` should be combined with the unreserved request parameters. Where both sets contain the same parameter binding, the one from the request parameters should override the one from the `api:filter`.

This set of parameter bindings should be converted into something matching [TriplesSameSubject](http://www.w3.org/TR/rdf-sparql-query/#rTriplesSameSubject). The subject is `?item`.

For each parameter binding, the name should be mapped to a list of properties by

  1. removing the prefix `min-`, `max-`, `minEx-`, `maxEx-`, `name-` or `exists-`
  1. splitting it on dots
  1. mapping each part to a property

It is an error if any of the parts cannot be mapped to a property. The API should return a `400 Bad Request` error if the parameter binding came from a request parameter, and a `500 Internal Server Error` if it was present in the configuration.

The value should be mapped to an object. The type of the object is determined by the type of the parameter and the range of the final property in the list, as follows:

  * `<varValue>` if the parameter is of type rdfs:Resource or
  * `"varValue"^^varType` if the parameter is of a specific datatype or
  * `"varValue"@varLang` if the parameter has a specific language or
  * `<resource>` if the final property has a specified range that isn't a rdfs:Literal and there is a known resource whose short name (for example indicated through `api:label`) is the variable value or
  * `"varValue"^^varType` if the final property has a range of a specific datatype or
  * an object that satisfies the constraints:
    * the string value of the object is the value of the parameter
    * if there are any default languages, the language of the object is one of these

In this last case, the default languages are set through the first of:

  * the `_lang` request parameter
  * the `api:lang` property on the Endpoint
  * the `api:lang` property on the API

The testing of the language can be done through either a `UNION` pattern or a `FILTER` on the language of the value. For example, a search for `?label=Wrexham&_lang=en,cy` could be mapped into the SPARQL query:

```
{ ?item rdfs:label "Wrexham"@en }
UNION
{ ?item rdfs:label "Wrexham"@cy }
```

or:

```
?item rdfs:label ?value
FILTER (
  string(?value) = "Wrexham" &&
  (
    lang(?value) = "en" ||
    lang(?value) = "cy"
  )
)
```

The query can then be constructed by creating a property list for each parameter binding. This is done as follows. In the case of a degenerate chain of a single property the triple pattern is:

`?item {property} {value} .`

where `{value}` is as described above. In the case of a chain longer than one then a series of patterns of the form:

```
?item {property 0} ?{var 0} .
...
?{var i-1} {property i} ?{var i} .
...
?{var n} {property n} {value} .
```

Where each `{var i}` is a newly allocated variable name, distinct from
other variables in the query. Implementations are free to translate this flat chain into equivalent SPARQL queries through use of blank nodes.

For example, say there is a parameter binding with the name `localAuthority.code` and value `00BX`. The name is split into `localAuthority` and `code` and these are mapped on to the properties `sch:localAuthority` and `skos:notation`. The resulting SPARQL is:

```
?item sch:localAuthority ?x1.
?x1  skos:notation "00BX" .
```

or, equivalently

```
?item sch:localAuthority [ skos:notation "00BX" ] .
```

If the original parameter binding had a recognised prefix, however, rather than specifying the object as part of the pattern directly, the object should be bound to a parameter which is then tested with a FILTER clause. The FILTER clause depends on the prefix used (in the following `?value` is the variable used to bind to the value of the property, and `object` is the object derived from the value in the parameter binding):

  * `min-` indicates `FILTER (?value >= object)`
  * `max-` indicates `FILTER (?value <= object)`
  * `minEx-` indicates `FILTER (?value > object)`
  * `maxEx-` indicates `FILTER (?value < object)`
  * `name-` indicates `object rdfs:label ?value .`

A prefix of `exists-` is a special case that involves further changes to the pattern, depending o its value:

  * `true` -- no further change to the pattern is required. Will ensure that the property exists, regardless of value
  * `false` -- the pattern should be wrapped in an OPTIONAL clause and followed by a `FILTER (!bound(?value))` expression to negate the match

#### Ordering ####

The ordering of resources is based on a [ORDER BY clause](http://www.w3.org/TR/rdf-sparql-query/#rOrderClause). The clause is created using:

  * the `_orderBy` request parameter, if present
  * otherwise, the `_sort` request parameter, if present
  * otherwise, the `api:orderBy` property of the selector, if present
  * otherwise, the `api:sort` property of the selector, if present
  * otherwise, the ordering specified by the selector indicated by the `api:parent` property of the selector, if present; implementations should issue a warning if the parent orders its items through an explicit query as opposed to using a separate ordering specification
  * otherwise no ORDER BY is applied

The `_orderBy` request parameter and `api:orderBy` property contain space-separated [OrderConditions](http://www.w3.org/TR/rdf-sparql-query/#rOrderCondition) which are turned into an ORDER BY clause simply by prepending `ORDER BY `. Note that this can only practically be used with `_where` and `api:where` since the variable bindings from the WHERE clause must be known for the ordering to be specified.

The `_sort` request parameter and `api:sort` property contain a sort specification which can be converted into a sequence of OrderConditions by first splitting the string based on commas and then, for each one:

  1. removing any leading hyphen, which indicates a descending search
  1. mapping the property path onto a list of properties; it is an error if this cannot be done (a `400 Bad Request` if the sort specification was request parameter, a `500 Internal Server Error` if it originated in the configuration file)
  1. if one is not already present, adding a pattern within the WHERE clause based on that property list, with a variable as the object
  1. creating an OrderCondition that references that variable, in the form `DESC(?varName)` if the sort specification started with a hyphen; if the range of the last property in the property list is a recognised XML Schema datatype, the relevant cast should be added

_Note: Sort specifications can be safely dropped if their values have already been fixed within the WHERE clause._

For example, start with the sort specification `-rating,sell.price`. Say that `rating` mapped on to `eg:rating`, `sell` onto `eg:sellingAt` and price onto `eg:price`, that `eg:rating` had a range of `xsd:integer` and `eg:price` had a range of `xsd:decimal`. In that case, the following would be added to the filter:

```
?item
  eg:rating ?rating ;
  eg:sellingAt [ eg:price ?price ] .
```

and the ORDER BY clause would look like:

```
ORDER BY DESC(xsd:integer(?rating)) xsd:decimal(?price)
```

_der: Why the explicit coercion?  If the range of eg:rating and eg:price is as you state then just need `ORDER BY DESC(?rating) ?price` surely?_