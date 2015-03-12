## List-valued properties ##

RDF collections (aka lists) should also map into JSON arrays:
```
   <http://example.com/r1>  eg:prop ("foo" "bar" "baz") .
```

becomes

```
   {
      "@" : "http://example.com/r1",
      "prop" : [ "foo", "bar", "baz" ]
   }
```


This means that Lists do not round trip. There are various possible solutions to this.

**Status:** Agreed that this should be the mapping?

Proposed that the mapping object could record sufficient information to allow round tripping in easy cases but that is not agreed yet:

```
   "properties" : [
       { "name" : "prop",
         "uri" : "http://example.com/ont#prop",
         "range" : "rdfs:List" }
   ]    
```