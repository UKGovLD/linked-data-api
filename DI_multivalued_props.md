## Multi-valued properties ##

When there are multiple objects for the same subject/predicate they should map to JSON arrays:

```
   <http://example.com/r1>  eg:prop "foo", "bar", "baz" .
```

becomes

```
   {
      "@" : "http://example.com/r1",
      "prop" : [ "foo", "bar", "baz" ]
   }
```

When there are single values no array is used:

```
   <http://example.com/r1>  eg:prop "foo" .
```

becomes

```
   {
      "@" : "http://example.com/r1",
      "prop" : "foo"
   }
```

but the publisher can configure the API to always return an array to give consistency for the consumer.

**Status:** Agreed that multiple values map into arrays and that single values should generally map onto simple values. Some discussion on whether the transition between the two is driven by the data (all uses of a given property in a given result set are consistent), by configuration or by the simple default.