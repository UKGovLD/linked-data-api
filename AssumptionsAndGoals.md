# Aims #

  * A RESTful API that supports access to linked data in ways that normal developers and existing tools can use easily.

  * A JSON-based publishing format for RDF that is optimised for approachability for normal developers. The ability to invert the formatting, so that interested clients can recover RDF triples from the simplified format, is a nice-to-have extra. Must not come at the expense of convenience of the format for normal developers. In particular, it is acceptable for the mapping to only be invertible in the simple "80%" of cases.

  * Support for URIs that access particular RDF graphs, lists of results with associated descriptions (with pagination) and results of SPARQL queries. These may overlap.

  * As a publisher it should be possible to make data available through this API with a minimum of configuration. Configuration options to tune how the data is presented should be available but not required to get started. Convention over configuration.

  * Any configuration should be done in a declarative, platform-neutral language; this level of standardisation will make it easier to create tools for creating linked data APIs.

# Assumptions #

  * The data to be exposed is accessible as linked data (ie resource URIs are resolvable) and through a SPARQL end point.

  * The publisher of the API may or may not be the publisher of the linked data.