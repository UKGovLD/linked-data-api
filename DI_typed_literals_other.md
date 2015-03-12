## Typed literals - others ##

In some cases non-xsd data types are used to indicate the interpretation of values such as in:

```
  <http://statistics.data.gov.uk/id/local-authority-district/00PB>
    skos:notation "00PB"^^geo:StandardCode ;
    skos:notation "6405"^^transport:LocalAuthorityCode .
```

in those cases Jeni points out that as well as the above options we could also move the type information in the property name (analogous to one possible handling of lang tags):

```
  {
    "@": "http://statistics.data.gov.uk/id/local-authority-district/00PB",
    "onsCode": "00PB",
    "dftCode": "6405"
  }
```

**Status:**