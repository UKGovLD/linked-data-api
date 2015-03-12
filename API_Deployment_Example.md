[Go to Summary and Contents](Specification.md)

# Deployment Example #

The following examples provide an illustration of the range of access patterns that the API is intended to support. The example URIs are taken from the Edubase data published by the data.gov.uk project at `http://education.data.gov.uk/`:

  * `/doc/school/12345` should respond with a document that includes information about `/id/school/12345` (a [concise bounded description](http://www.w3.org/Submission/CBD/) of that resource)
  * `/doc/school` should return the first page of a list of schools in alphabetical order based on their name, including only the labels and types of those schools
  * `/doc/school?_page=2` should return the second page of results
  * `/doc/school?_view=detailed` should return a list of schools, including a certain (larger) set of properties of those schools
  * `/doc/school?_sort=size` should return a list of schools in ascending size order
  * `/doc/school?_sort=-size` should return a list of schools in descending size order
  * `/doc/school?_sort=-size,name` should return a list of schools sorted first in descending size, then by name
  * `/doc/school?type=primary` should return a list of primary schools
  * `/doc/school/primary` should be a shorthand for the above
  * `/doc/school?district.code=00BX` should return a list of schools in the administrative district whose `skos:notation` is `00BX`
  * `/doc/school/district/00BX` should be an alias for the above
  * `/doc/school?district.name=City+of+London` should return a list of schools in the administrative district whose `rdfs:label` is `City of London`
  * `/doc/school?search-district.name=London` should return a list of schools whose administrative district's name contains `London` (in API implementations that support free-text search)
  * `/doc/school?near-lat=0&near-long=0&distance=5` should return a list of schools within five miles of 0,0 (in API implementations that support geographic search)

For all of the above, it should be possible to use a suffix on the part of the URI prior to the search query to indicate the type of the response. For example:

  * `/doc/school.ttl?district.code=00BX` should return Turtle
  * `/doc/school.json?district.code=00BX` should return simple JSON
  * `/doc/school.rdf?district.code=00BX` should return RDF/XML
  * `/doc/school.xml?district.code=00BX` should return simple XML

_Note that the API layer will not carry out the `303 See Other` redirection from `/id/school/12345` to `/doc/school/12345`; it's expected that this will be done through a proxying layer above the API_

The API itself would be described at:

`http://education.data.gov.uk/api`

This would return the specification of the API (in various formats just as before), and API implementations may offer the ability to adjust the API through PUTting or POSTing to that URI.

The API specification for a particular list would be available at:

`http://education.data.gov.uk/api/doc/school`

Note that the structure of these URIs is API implementation dependent; we would require the result of a query on the API to include a pointer to the specification for the particular returned list. For example, at `/doc/school`:

```
{
  "format": "linked-data-api",
  "version": "0.1",
  "result": {
    "_about": "http://education.data.gov.uk/doc/school?page=0",
    "metadata": "http://education.data.gov.uk/api/doc/school",
    "partOf": "http://education.data.gov.uk/doc/school",
    "next": "http://education.data.gov.uk/doc/school?page=1",
    "first": "http://education.data.gov.uk/doc/school?page=0",
    "page": 0,
    "pageSize": 10,
    "contains": [{
      "_about" : "/id/school/12345" ,
      "name" : "St Johns School" ,
      "type" : [ "school", "primary" ]
    }, {
      ...
    }, ... ]
  }
}
```