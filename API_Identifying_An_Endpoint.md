[Go to Summary and Contents](Specification.md)

# Identifying an Endpoint #

Incoming requests to the API layer must be mapped through to an **Endpoint** that describes further processing of the request.

An Endpoint will have:

  * A URI Template that identifies the set of URLs to which it should respond
  * Optionally, a Item Template that describes how to construct a URI for delivery of Linked Data
  * Optionally, a set of Variables that will be added to the Context during processing
  * A Selector that describes how to retrieve a list of resources from the configured SPARQL Endpoint
  * A set of named Viewers that describe specific sets of properties to retrieve about each resource
  * A list of named Formatters that define the possible representation formats that can be delivered to a client.

The identification of the Endpoint to use to service a request involves testing the URI Templates associated with all of the configured Endpoints against the structure of the incoming request.

## Detailed Processing ##

When a request is made, the query part of the request URI is split off to create a set of **request parameter bindings**.

The `api:base` property of the API is then stripped from the start of the request URI to give a **request path**. If the API has no `api:base` property then the authority (server name) is stripped from the request URI.

If the last segment in the request path ends in an extension which names a known formatter, this extension is stripped from the request path. See the section on Formatting Graphs below for more details.

The endpoints associated with the API can be identified through the `api:endpoint` property. The path is matched against an endpoint as follows:

  1. if the request path and parameter bindings match the `api:uriTemplate` of an endpoint, that endpoint is used; it is implementation defined which endpoint is used if there is more than one whose `api:uriTemplate` matches
  1. otherwise, the API returns a `404 Not Found`

To determine whether a `api:uriTemplate` matches the request, the `api:uriTemplate` should first be processed to create an **endpoint path template** and a set of **endpoint parameter templates**. The endpoint path template matches the request path if the request path matches a regular expression formed by replacing any occurrences of `{varName}` within the request path template with `([^/]+)`. The endpoint parameter templates match the request parameter bindings if every endpoint parameter template matches a request parameter binding. An endpoint parameter template matches a request parameter binding if the names are the same and either the values are the same or the value of the endpoint parameter template looks like `{varName}`.

_Note: This testing between endpoint parameter templates and request parameter bindings does not take into account any typing. The values must exactly match for the endpoint to be a match to the request._

## Examples ##

The request URI:

<pre>http://education.data.gov.uk/doc/school/localAuthority/00BX?type=primary</pre>

would match the URI templates:

```
doc/school/localAuthority/{code}
doc/school/localAuthority/{code}?type={type}
doc/school/localAuthority/{code}?type=primary
doc/school/{concept}/{code}
```

It would not match:

```
doc/school/localAuthority/{code}?boarding=true
doc/school/{identifier}
```