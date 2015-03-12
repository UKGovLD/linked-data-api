# Handling the `val` in `P=val` #

The value _val_ should be converted to a SPARQL object according to the
_applied type_ and the _applied language_.

The _applied type_ of a parameter is the type of the parameter if it
has one, and otherwise the range of the final property in the parameter if
it has one. (Thus, parameter types over-ride range types; this allows
settings in the LDA configuration to over-ride range declarations in
imported vocabularies.)

The _applied languages_ of a parameter `P` are the languages applied to the parameter by `lang-P=`, if there is one; if not, any languages specified by `_lang=`, if there are any; otherwise any languages applied by `api:lang` in the endpoint; otherwise any languages applied by `api:lang` in the spec.

Taken in order:

  * if the applied type is `rdfs:Resource` or `owl:Thing`, then `Resource(val)`. (`Thing` as well as `Resource` so that imported vocabularies can be in RDFS or OWL.)

  * if the applied type is `api:SimpleLiteral`, then `Simple(val)`. We introduce this new type to allow untyped unlanguaged literals as the objects of properties. (Otherwise we get caught up in the complications of `_lang` and shortname expansion.)

  * if the applied type is `api:PlainLiteral`, then `Plain(val)`.

  * if the applied type is a datatype, then `Typed(val, type)`. "Is a datatype" means:
    * is any `xsd: class`
    * or is `rdf:XMLLiteral`
    * or is of type `rdfs:Datatype`
    * or is the range of an `owl:DatatypeProperty`

  * if the type is some object type (_ie_ any remaining type -- not one of the types specifically mentioned above), then `Resource(val)`.

  * otherwise, the parameter is untyped: `Plain(val)`.

`Resource(val)` is `<expanded>` if `val` is a short name for the
URI `expanded`, and `<val>` otherwise.

`Simple(val)` is `"val"`.

`Typed(val, type)` is `"val"^^<type>`.

`Plain(val)` depends on the applied languages. It is:

  * `"val"` if there are none. Otherwise there are languages `L1..Ln`.
  * a fresh variable `?v`, together with a filter specifying allowed values for the `str` and `lang` of that variable.
  * OR, if the value would be used as the object O of some triple `(S P O)`, replace that triple by a union specifying all the allowed languaged literals.
  * OR if there's only one language L, simplifying to "val"@L.

Multi-term union:

> {{S P "val"@L1} UNION ... {S P "val"@Ln}}

Multi-language filter:

> FILTER( str(?v) && (lang(?v) = "L1" || ... lang(?v) = "Ln") )