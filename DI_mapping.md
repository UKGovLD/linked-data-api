## Mapping and context ##

The wrapper should include an object which records enough of the mapping from the source RDF to the JSONs to allow some inversion (turn the JSON back into RDF, which at least partial round tripping). Developers who don't care about the RDF mapping should find it easy ignore this mapping information.

At a minimum this mapping information should allow property names (and any abbreviated resource identifiers) to be mapped to URIs.

RDFj does this via a `"context"` property on the outermost object:

```
"context": {
    "base": ...,
    "token": ...
  }
```

Exhibit uses a `"properties"` table which also includes (inferred) range information to allow the type of the property values to be handled appropriately.

```
"properties" : {
    "sampleQuery" :       {
        "uri" :       "http://www.epimorphics.com/example#sampleQuery",
        "valueType" : "item"
    },
    "number-of-triples" : {
        "uri" :       "http://www.epimorphics.com/example#numTriples",
        "valueType" : "number"
    }
    ...
```

irON uses a separate _linkage_ document which defines prfixes and aliases for both properties and types:

```
{
    "linkage": {
        "version": "0.1",
        "linkedType": "application/rdf+xml",
        "prefixList": {
            "bibo": "http://purl.org/ontology/bibo/",
            "dcterms": "http://purl.org/dc/elements/1.1/",
            ...
        },
        "attributeList": {
             "address": { "mapTo": "address:localityName" },
             "author": { "mapTo": "dcterms:creator" },
             ...
        },
        "typeList": {
             "article": { "mapTo": "bibo:Article" },
             ...
        }
    }
}
```

**Status:** I (der) think the notion of a context/mapping/properties table is possibly agreed but the details are not. RDFj's context is simple and appealing, however the range information would allow more complete round tripping (handling of typed literals and RDF lists) depending on other decisions.