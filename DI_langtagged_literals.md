## Language tagged literals ##

Literals with a language tag such as:

```
  <http://statistics.data.gov.uk/id/local-authority-district/00PB>
    skos:prefLabel "The County Borough of Bridgend"@en ;
    skos:prefLabel "Pen-y-bont ar Ogwr"@cy ;
```

could be handled in different ways.

There seems to be a general trade-off between the ease of:

  * getting a value in no language
  * getting a value in a default language
  * getting a value in a particular language
  * accessing all the values for a property
  * ascertaining the language of a particular value

Various options are described here, for discussion.

1. Use lexical encoding of `rdf:PlainLiteral` (dropping trailing `@` for simple strings with no language).

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel" : [
    "The County Borough of Bridgend@en" ,
    "Pen-y-bont ar Ogwr@cy"
  ]
}
```

This is the RDFj approach and Mark points out that a JSON API could easily provide access to the value/lang parts of the string as if they were separate object fields. However, to be generally usable it requires introducing an escape sequence to avoid problems with literal values that contain `@` symbols (such as email addresses). We also need the JSON that is produced from a linked data API to be easily processed by normal web developers without requiring them to use a specialised library.

2. Move the language encoding into the property name, for example:

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel_en" : "The County Borough of Bridgend" ,
  "prefLabel_cy" :  "Pen-y-bont ar Ogwr" 
}
```

with the added option of automatically providing an unadjusted property name for the primary language of the API (if all the values have a language), so that you'd get:

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel" : "The County Borough of Bridgend" ,
  "prefLabel_en" : "The County Borough of Bridgend" ,
  "prefLabel_cy" :  "Pen-y-bont ar Ogwr" 
}
```

The generic behaviour (of adding the language as a suffix) could be overridden by an explicit mapping, for example:

```
<http:/statistics.data.gov.uk/>
  a api:API ;
  api:mapping [
    api:property skos:prefLabel ;
    api:lang "en" ;
    api:prefPropertyLabel "name" ;
  ] , [
    api:property skos:prefLabel ;
    api:lang "cy" ;
    api:prefPropertyLabel "welshName" ;
  ] .
```

leading to:

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "name" : "The County Borough of Bridgend" ,
  "welshName" :  "Pen-y-bont ar Ogwr" 
}
```

The headers in the JSON result would need to describe the language of each property in this case.

3. Encode each value as a structured object.

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel": [
    { 
      "value": "The County Borough of Bridgend" ,
      "lang": "en"
    }, {
      "value": "Pen-y-bont ar Ogwr" ,
      "lang": "cy"
    }
  ]
}
```

To provide predictability, we would need to do this for every value, even those without languages (although it could be suppressed for some perhaps with a setting the API definition), which would make the JSON much closer to JSON/RDF than to RDFj.

4. Provide language properties.

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel": {
    "en": "The County Borough of Bridgend" ,
    "cy": "Pen-y-bont ar Ogwr"
  }
}
```

Again, to provide predictability, we would need to do this for all properties that could have values with languages, which makes it relatively complex to access simple values. The syntax for accessing values that don't have languages becomes a little weird:

```
district.prefLabel['']
```

though accessing a property with a particular language is a lot easier than in the structured object as above.

This approach could be coupled with basic, non-language-specific access, as in:

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel": [ "The County Borough of Bridgend" , "Pen-y-bont ar Ogwr" ] ,
  "prefLabel_lang": {
    "en": "The County Borough of Bridgend" ,
    "cy": "Pen-y-bont ar Ogwr"
  }
}
```

5. Use parallel arrays.

```
{
  "@" : "http://statistics.data.gov.uk/id/local-authority-district/00PB" ,
  "prefLabel" : [ "The County Borough of Bridgend" , "Pen-y-bont ar Ogwr" ] ,
  "_lang_prefLabel" : [ "en", "cy" ]
}
```

This has the advantage that the interface isn't that much different from normal multi-valued properties. If you're iterating through the values, it's relatively easy to find the language of a particular value. If you want the value of the property in a particular language, that's fairly easy too: for example, with jQuery:

```
district.prefLabel[$.inArray('en', district._lang_prefLabel)]
```

**Status:** Under discussion.