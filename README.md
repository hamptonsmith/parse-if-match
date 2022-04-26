# parse-if-match

Parses `If-Match` and `If-None-Match` HTTP headers as specified in
[RFC 7232, Sections 3.1 and 3.2](https://www.rfc-editor.org/rfc/rfc7232#section-3.1).

## TL;DR

```javascript
const assert = require('assert');
const parseIfMatch = require('@shieldsbetter/parse-if-match');

assert.deepEqual(
    parseIfMatch('"abc", W/"bcd"'),
    [
        { eTag: 'abc', weak: false },
        { eTag: 'bcd', weak: true }
    ]);

assert.deepEqual(
    parseIfMatch('*'),
    [
        { star: true }
    ]);

try {
    parseIfMatch('bad');
}
catch (e) {
    assert.equal(e.code, 'PARSE_ERROR');
}

// RFC 7232 insists there be at least one ETag
try {
    parseIfMatch('');
}
catch (e) {
    assert.equal(e.code, 'PARSE_ERROR');
}
```
