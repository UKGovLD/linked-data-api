[Go to Summary and Contents](Specification.md)

# Property Paths #

Throughout the API specification and within URIs, **property paths** can be used to point to values within the data. The syntax of a property path is:

```
propertyPath := property ('.' propertyPath)*
property     := [a-zA-Z][a-zA-Z0-9_]*
```

_Note: Properties are constrained here to match the constraints on Javascript properties, to make the JSON easier to use. These restrictions also make it easier to use the property names within URIs._

For a property name used in a property path to be recognised, the API must have a mapping between the property name and the equivalent RDF property URI. Only properties for which this has been configured within the API will be recognised by the API (when it comes to specifying selectors and viewers; short names for all properties are supported when a full description of a resource is requested).

A property name is configured within the API by describing the property within the API specification itself or by pointing to an external ontology in which the property is described using the `api:vocabulary` property of the `api:API`.

Property descriptions provided as part of the API specification take precedence over those found in external ontologies.

If a property description is available, the property name will be (in order of priority):

  * the `api:label` of the property
  * the `rdfs:label` of the property
  * the local name of the property (the part after the last hash or slash)

If none of these match the _property_ production above, the property does not have a name suitable for querying in the API.