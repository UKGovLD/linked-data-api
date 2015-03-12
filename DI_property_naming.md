## Property naming ##

Linked Data APIs need to use short names for properties in two ways:

  * within simple formats such as JSON that are generated from existing RDF
  * in mapping names used in the path or query within a URI to SPARQL queries

To avoid confusion, the short names used in the two scenarios should be exactly the same: if a developer wants to sort search results on district (say), they will expect the short name to be `district` in both the URI that's used to carry out the search (ie it will contain `?sort=district`) and in the JSON results. The rules for the short name of a given property must work in both directions: generation and recognition.

It is also important that the short name for a given property is stable across an API: it would be confusing if different names were used for a given property depending on what information were available about a given resource, for example.

### Sources of Short Names ###

The following can be used, with lowest priority first, to determine a short name that is used for a given property by a given API:

  * the local part of the URI for the property, namely the part after the `#` if it exists or the final `/` if there is no `#`
  * the value of the `rdfs:label` property of the property whose datatype is `xsd:NCName`, if there is one (other labels are ignored since they are likely to be human readable and therefore less suitable as short names than the local part of the URI)
  * the value of the `api:altLabel` property of the property
  * the value of the `api:prefLabel` property of the property
  * the value of the `api:label` property of the `api:Mapping` whose `api:property` is the property

These options may lead to a number of possible short names being available for a given property, and the same short name being a possibility for multiple properties. Implementations may add prefixes or suffixes to create unique labels. Adding a prefix is preferable, if one is known for the namespace of the property. Otherwise numeric suffixes may be used. It's expected in both cases that publishers will supply a `api:Mapping` for the property to make the names more readable.

APIs must create a semi-permanent mapping between properties and short names, used both when creating JSON and other formats, and for recognising those terms in URIs. After an initial set of mappings has been created, APIs may need to assign labels to new properties. These mappings must not change existing mappings, since that would introduce backwards-incompatible changes in the API, breaking downstream code.

### Guidelines For Names ###

There are no technical limitations on the content of a short name: any name can be used within a JSON property or (with appropriate escaping) within a URI. However, to make the short names more usable within both Javascript and URIs, the short names should:

  * begin with upper or lowercase A-Z, an underscore (`_`) or dollar sign (`$`)
  * contain only upper or lowercase A-Z, decimal digits 0-9, underscores (`_`) and dollar signs (`$`)

Names that follow these constraints will not require escaping and can be used with dot-notation within Javascript.

Additionally, names that begin with an underscore (`_`) are usually set aside for reserved properties (such as `_about`), so should be avoided. [Words that are reserved within Javascript](https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Reserved_Words) should also be avoided.

**Status:** Agreed on principle, not necessarily details.