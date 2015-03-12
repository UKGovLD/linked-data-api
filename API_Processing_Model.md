[Go to Summary and Contents](Specification.md)

# Processing Model #

The API layer is intended to associate URLs with processing logic that will extract data from a SPARQL endpoint using one or more SPARQL queries and then serialize the results using the format requested by the client.

A URL may identify a single resource whose properties are to be retrieved. The URL may also identify a set of resources, either through structure of the URL or through query parameters.

![http://linked-data-api.googlecode.com/files/processing-model.png](http://linked-data-api.googlecode.com/files/processing-model.png)

This process can be summarised with the following steps:

  1. **Identifying an Endpoint** -- the API receives a `GET` request made to a particular URI. This request is is mapped to an **Endpoint** that describes further processing logic
  1. **Binding Variables** -- the API creates a number of variable bindings based on the structure and parameters of the incoming request, and the Endpoint configuration. These variables as well as the available API configuration and request metadata describe the **Context** for the execution.
  1. **Selecting Resources** -- the API identifies a sequence of items who properties are to be returned. Usually this will be based on a **Selector** that describes how to identify a single item or an ordered list of resources, in concert with the available bindings
  1. **Viewing Resources** -- the API retrieves the desired properties of the identified resource, constructing an RDF graph of the results. This process is described by a **Viewer** that identifies the relevant properties of the resources.
  1. **Formatting Graphs** -- the API identifies how to serialize the resulting RDF graph to the client. This process is defined by a **Formatter**

The following sections describe each of these steps in more detail.