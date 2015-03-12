[Go to Summary and Contents](Specification.md)

# Query Parameters #

Query parameters can be used to:

  * change what items appear in a list (the selector)
  * change what properties are listed for each item (the viewer)
  * change the way the list is serialised (the formatter)
  * provide default bindings for executed SPARQL queries

The `query` parameter can be used to create an arbitrary graph (based on a SPARQL query) which is serialised in the normal way. To simplify matters, this SPARQL query:

  * automatically includes namespace bindings that are defined globally within the API
  * automatically supports pagination features through the addition of `LIMIT` and `OFFSET` (_JT: I'm assuming we want to do this, but perhaps not_)

## Selecting ##

Parameters can be used to specify properties to select items on:

  * `param=value` - resources whose `param` has the specified `value`
  * `min-param=value` - resources whose `param` is greater than or equal to the specified `value`
  * `max-param=value` - resources whose `param` is less than or equal to the specified `value`
  * `minEx-param=value` - resources whose `param` is greater than the specified `value`
  * `maxEx-param=value` - resources whose `param` is less than the specified `value`
  * `exists-param=(true|false)` - resources that do or do not have a value specified for `param`

_JT: how do we describe free text and geographic searches in these terms?_

In each of these cases, `param` may be a property path as described above.

Multiple specifications of the same parameter indicate a union. Intersection and negation can only be done through escaping to SPARQL (through `_where` or `_query`).

In addition, we define the following built-in query parameters:

  * `_page` is a number; the page that should be viewed
  * `_pageSize` is a number; the number of items per page
  * `_sort` is a comma-separated list of property paths to values that should be sorted on. A `-` prefix on a property path indicates a descending search
  * `_where` is a "GroupGraphPattern":http://www.w3.org/TR/rdf-sparql-query/#GroupPatterns (without the wrapping `{}`s)
  * `_orderBy` is a space-separated list of [OrderConditions](http://www.w3.org/TR/rdf-sparql-query/#rOrderCondition)
  * `_select` is a [SELECT query](http://www.w3.org/TR/rdf-sparql-query/#select)
  * `callback` is a valid javascript function name. If present when JSON is requested, it will be served as JSONP, where the JSON object is wrapped in a call to the function named with the `callback` request parameter.
### Examples ###

Let us say that `/doc/school` has been configured to return all schools.

We can find all primary schools (schools whose type is 'primary') with:

```
/doc/school?type=primary
```

We can find all schools whose size is greater than 300 with:

```
/doc/school?min-size=300
```

We can find all primary schools with over 300 pupils with:

```
/doc/school?type=primary&min-size=300
```

We can find all primary and secondary schools with:

```
/doc/school?type=primary&type=secondary
```

We can find all schools in the local authority whose name is 'Surrey' with:

```
/doc/school?localAuthority.name=Surrey
```

## Viewing ##

We define the following built-in parameters:
  * `_template` is a "GroupGraphPattern":http://www.w3.org/TR/rdf-sparql-query/#GroupPatterns (without the wrapping `{}`s) used to generate a CONSTRUCT query for retrieving the triples to be formatted.
  * `_view` is the name of a viewer associated with the URI
  * `_properties` is a comma-separated list of property paths that should be included in the description of the resources in the list

### Examples ###

We can access a more detailed view of the schools (as defined by the API) with:

```
/doc/school?_view=detailed
```

We can view the name of the school, its district, district code and district name with:

```
/doc/school?_properties=name,district.code,district.name
```

## Formatting ##

We define the following built-in parameter:

  * `_format` is the name of a format associated with the URI that is used to format it

When an XSLT-based rendering is used, all parameters that are specified within the URI or defined within the API specification are passed to the XSLT stylesheet.