[Go to Summary and Contents](Specification.md)

# Rationale and Requirements #

Simple RESTful APIs are well supported and understood by a large community of web developers. Faced with Linked Data and SPARQL endpoints this community faces a steep learning curve before they are able to make use of the power provided by the underlying technologies. Put differently, SPARQL is a power tool whose sophistication is unnecessary for many users.

There is scope for a standard way to provide simple RESTful APIs over RDF graphs to bridge the gap between Linked Data and SPARQL. This specification aims to fill that gap by defining an easy to use and easy to deploy API layer that can act as a proxy for any SPARQL endpoint. This proxy supports generation of:

  * Easy-to-process representations of resources (simple JSON, XML and CSV formats)
  * Easy-to-construct lists of resources based on various selection criteria

The goal is for the API layer to provide some basic functionality "out-of-the-box", but provide a range of configuration options to support additional, domain-specific customisation and functionality.

The API layer may be deployed directly by the publisher of the SPARQL endpoint or may be deployed by a third-party, perhaps as a local proxy to a remote endpoint.

The following additional requirements have driven the creation of this specification:

  * The configuration syntax need to be simple, easy to author, and should support a "view source" approach to customising the API layer and the creation of new services. i.e. the configuration needs to be writable by hackers and understandable without the need for tool support
  * The configuration needs to be abstract enough to be easy, have enough depth to do the hard things. In practice this means that a simple declarative approach is supplemented by an "escape mechanism" allowing users to bind SPARQL queries directly to URLs
  * The API design should not force any particular URI pattern and be flexible to support a range of approaches and best practices. E.g `/doc/school/primary` or `/list/school/primary` should both be valid for defining a list of schools.
  * The API should support rendering to simple formats using content negotiation, suffixes and parameters, with depth and flexibility to support domain-specific or URI-specific views of data
  * The API should support both schema-less (all properties of a particular resource) and templated (lists of properties) views should be supported
  * Generation views containing lists of resources should be pageable
  * The APIs should provide a stepping stone to help publishers and developers get into linked data. E.g it should include things like URIs for resources, and reflect back SPARQL queries to allow developers to understand how a particular response was generated
  * The configuration should be extensible, allowing API providers and implementors to provide unique services. E.g. allowing users to carry out geographic searches or free-text searches within the APIs

Non-requirements are:

  * APIs do not have to support PUT/POST requests, this specification defines a read-only access layer over SPARQL endpoints
  * Not all results from the API will be available from the underlying SPARQL endpoint; best-practice documentation will encourage publishers to put any statements about non-information resources within the SPARQL endpoint