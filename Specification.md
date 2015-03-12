This document defines a vocabulary and processing model for a configurable API layer intended to support the creation of simple RESTful APIs over RDF triple stores.

The API layer is intended to be deployed as a proxy in front of a SPARQL endpoint to support:

  * Generation of documents (information resources) for the publishing of Linked Data
  * Provision of sophisticated querying and data extraction features, without the need for end-users to write SPARQL queries
  * Delivery of multiple output formats from these APIs, including a simple serialisation of RDF in JSON syntax

## Table of Contents ##

  1. [Rationale](API_Rationale)
  1. [Deployment Example](http://code.google.com/p/linked-data-api/wiki/API_Deployment_Example)
  1. [Processing Model](http://code.google.com/p/linked-data-api/wiki/API_Processing_Model)
    1. [Identifying An Endpoint](http://code.google.com/p/linked-data-api/wiki/API_Identifying_An_Endpoint)
    1. [Binding Variables](http://code.google.com/p/linked-data-api/wiki/API_Binding_Variables)
    1. [Selecting Resources](http://code.google.com/p/linked-data-api/wiki/API_Selecting_Resources)
    1. [Viewing Resources](http://code.google.com/p/linked-data-api/wiki/API_Viewing_Resources)
    1. [Formatting Graphs](http://code.google.com/p/linked-data-api/wiki/API_Formatting_Graphs)
  1. [Property Paths](http://code.google.com/p/linked-data-api/wiki/API_Property_Paths)
  1. [Query Parameters](http://code.google.com/p/linked-data-api/wiki/API_Query_Parameters)
  1. [Vocabulary](http://code.google.com/p/linked-data-api/wiki/API_Vocabulary)

## Document Conventions ##

The examples used in this document assume that the following namespaces have been defined, unless otherwise states

|rdf|`http://www.w3.org/1999/02/22-rdf-syntax-ns#`|
|:--|:--------------------------------------------|
|rdfs|`http://www.w3.org/2000/01/rdf-schema#`|
|xsd|`http://www.w3.org/2001/XMLSchema#`|
|api|`http://purl.org/linked-data/api/vocab#`|

API configuration examples use the Turtle syntax for readability in the specification. This is not meant to constrain the syntaxes supported by implementations.
