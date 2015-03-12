This document defines a vocabulary and processing model for a configurable API layer intended to support the creation of simple RESTful APIs over RDF triple stores.

The API layer is intended to be deployed as a proxy in front of a SPARQL endpoint to support:

  * Generation of documents (information resources) for the publishing of Linked Data
  * Provision of sophisticated querying and data extraction features, without the need for end-users to write SPARQL queries
  * Delivery of multiple output formats from these APIs, including a simple serialisation of RDF in JSON syntax

## Table of Contents ##

  1. [Rationale](API_Rationale.md)
  1. [Deployment Example](API_Deployment_Example.md)
  1. [Processing Model](API_Processing_Model.md)
    1. [Identifying An Endpoint](API_Identifying_An_Endpoint.md)
    1. [Binding Variables](API_Binding_Variables.md)
    1. [Selecting Resources](API_Selecting_Resources.md)
    1. [Viewing Resources](API_Viewing_Resources.md)
    1. [Formatting Graphs](API_Formatting_Graphs.md)
  1. [Property Paths](API_Property_Paths.md)
  1. [Query Parameters](API_Query_Parameters.md)
  1. [Vocabulary](API_Vocabulary.md)

## Document Conventions ##

The examples used in this document assume that the following namespaces have been defined, unless otherwise states

|rdf|`http://www.w3.org/1999/02/22-rdf-syntax-ns#`|
|:--|:--------------------------------------------|
|rdfs|`http://www.w3.org/2000/01/rdf-schema#`|
|xsd|`http://www.w3.org/2001/XMLSchema#`|
|api|`http://purl.org/linked-data/api/vocab#`|

API configuration examples use the Turtle syntax for readability in the specification. This is not meant to constrain the syntaxes supported by implementations.
