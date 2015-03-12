# Existing JSON RDF formats to use or learn from #

## RDF/JSON ##
http://n2.talis.com/wiki/RDF_JSON_Specification

Full interchange format, faithful to the underlying RDF model. Not developer-friendly in the sense we mean here.

## SPARQL Results JSON format ##
http://www.w3.org/TR/rdf-sparql-json-res/

Faithful representation of variable bindings preserving the RDF structure. Again not quite as developer-friendly as we are aiming for in this context.

## RDFj ##
http://code.google.com/p/backplanejs/wiki/Rdfj

RDFj is a set of conventions for:

  * constructing JSON objects in such a way that they can easily be interpreted as RDF;
  * taking RDF and arriving at canonical JSON objects.

The name derives from the fact that it is a very close relative of RDFa.

Hits many of the criteria for this work.

## Simile Exhibit JSON format ##
http://simile.mit.edu/wiki/Exhibit/Creating,_Importing,_and_Managing_Data

Exhibit uses an RDF-like [data model](http://simile.mit.edu/wiki/Exhibit/Understanding_Exhibit_Database) and provides a JSON representation of that [format](http://simile.mit.edu/wiki/Exhibit/Understanding_Exhibit_JSON_Format). An online translator ([Babel](http://simile.mit.edu/babel/)) offers zero-configuration translation. The format is also supported by the RPI [SPARQL Proxy](http://data-gov.tw.rpi.edu/ws/sparqlproxy.php).

Hits many of the criteria for this work.

## irJSON ##
http://openstructs.org/iron/iron-specification#mozTocId462570

A JSON serialization profile of [irON](http://openstructs.org/iron/iron-specification).

Explanatory blog posts [[1](http://www.mkbergman.com/838/iron-semantic-web-for-mere-mortals/)] [[2](http://www.mkbergman.com/845/a-most-un-common-way-to-author-datasets/)] and a [case study](http://openstructs.org/iron/common-swt-annex).

# Non-RDF JSON formats of relevance #

## Freebase ##

That has a somewhat RDF-like abstract [data model](http://www.freebase.com/docs/data) but data is both queried and returned as JSON. A [query](http://www.freebase.com/docs/data/first_query) is a JSON template with nulls and blank structures where you want details filled in (plus meta properties for operations like sorting). Everything is identified by an "id" (a Freebase topic path, pretty much the trailing part of a URI) and/or a "guid".

## flickr ##

The [flickr API](http://www.flickr.com/services/api/response.json.html) is notable in that the JSON is a direct mapping from the XML API.

## Twitter ##

The [Twitter API](http://apiwiki.twitter.com/Twitter-API-Documentation) provides JSON and XML (Atom) formats. There are a whole bunch of different queries you can do, most of which contain nested objects etc. Interestingly, the JSON that you get back from a search does contain metadata about the search and a 'results' property that holds an array of the results. So that could be a relevant model for SPARQL results formats.

## CouchDB ##

[CouchDB](http://wiki.apache.org/couchdb/HTTP_Document_API) is a purely JSON API which has to be very generic (since CouchDB can be used to contain anything). It uses reserved property names like "_id" (this and "_content" in the flickr API make me think that a leading underscore is the expected way to create reserved property names).

## Yahoo ##

[Yahoo!](http://developer.yahoo.com/common/json.html) have a JSON API that is again based on an XML API with a straight-forward mapping from the XML to the JSON.

## Google ##

The [Google Data Protocol](http://code.google.com/apis/gdata/docs/json.html) uses JSON that is generated from the equivalent Atom feed. Interestingly, they provide support for namespaces by having "xmlns" properties (with "$" used instead of ":" in any qualified names). Unlike the other APIs, they do use namespaces, but only a handful. I strongly doubt that any developer using it would actually resolve "openSearch$startIndex" by looking at the "xmlns$openSearch" property.

## JSONP ##

It's worth noting that most of these APIs support a callback= parameter that makes the API return Javascript containing a function call rather than simply the JSON itself. I regard this as an unquestionably essential part of a JSON API, whether it uses RDF/JSON or RDFj or irJSON or whatever, in order to make the JSON usable cross-site.