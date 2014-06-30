# node-pipe-segment-codec

See [pipe-segment](https://github.com/jbenet/node-pipe-segment).

This creates a codec segment, an encode/decode transform stream pair. The interfaces are duplex streams for connecting convenience.


## Install

```
npm install pipe-segment-codec
```

## Examples

```js
var through2 = require('through2')
var codecSegment = require('pipe-segment-codec')
// codecSegment is like a double transform stream pipe.
// it returns a segment object, with two duplex streams:
// - segment.encoded
// - segment.decoded
// and two readable error streams
// - segment.encodeErrors
// - segment.decodeErrors

function encode(obj) {
  return JSON.stringify(obj)
}

function decode(str) {
  return JSON.parse(str)
}

var s = codecSegment(encode, decode)

// helper passthrough.
function logthrough(prefix) {
  return through2.obj(function(data, enc, cb) {
    console.log(prefix + ': (' + typeof(data) + ') ' + data.toString())
    cb(null, data)
  })
}

// wire segment interfaces
s.encoded.pipe(logthrough('encoded')).pipe(s.encoded)
s.decoded.pipe(logthrough('decoded'))
s.encodeErrors.pipe(logthrough('encode error'))
s.decodeErrors.pipe(logthrough('decode error'))

s.decoded.write({a: 1, b: 2, c: 3})
s.decoded.write(100)
s.decoded.write([1, 2, 3])
s.encoded.write('{"d":4}')
s.encoded.write('200')
s.encoded.write('[4, 5, 6]')
s.encoded.write('{a: 1}') // invalid json
s.encoded.write('invalid{a: 1}') // invalid json
s.encoded.write('[1, 2, 3, [') // invalid json
```