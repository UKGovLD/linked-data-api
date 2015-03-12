## API result wrapper ##

The common case to support is APIs which returns lists of (possibly ordered) matching resources and their associated RDF descriptions. What constitutes a _match_ and an _appropriate description_ may be entirely driven by the publisher or they may provide a rich query API.

The API returns an outer JSON wrapper such as:

```
{
    "format" : "linked-data-api",
    "version" : "0.1",
    "mapping" : ... ,     // Not required, supports inversion
    "results" : [...]    // The resource descriptions
}
```

**Status**: Discussed, not agreed. Not clear if even the notion of having a wrapper is agreed and details certainly still open, both their nature and name. For example "results" might be better as "graph".