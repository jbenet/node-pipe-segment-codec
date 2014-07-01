var segment = require('pipe-segment')
var through2 = require('through2')
var duplexer2 = require('duplexer2.jbenet')

module.exports = codec

// options:
// - async: asynchronous encode/decode functions
// - transform: use a "transform streams interface":
//
//     --------- `encode` transform -------->
//     <-------- `decode` transform -------->
//
//        instead of a "duplex streams interface":
//
//     ----->  `decoded`  `encoded`  ----->
//     <-----   duplex      duplex   <-----
//
function codec(opts, encode, decode) {
  if (arguments.length == 2) {
    decode = encode
    encode = opts
    opts = {async: false}
  }

  var errE = through2.obj() // passthrough
  var errD = through2.obj() // passthrough
  var safe = opts.async ? asyncSafe : syncSafe

  // make two pairs of encoders (for different interfaces)
  var enc = through2.obj(safe(encode, errE))
  var dec = through2.obj(safe(decode, errD))

  var seg
  if (opts.transform) {
    seg = segment({
      encode: enc,
      decode: dec,
      encodeErrors: errE,
      decodeErrors: errD,
    })

  } else { // duplex
    var o = {objectMode: true, highWaterMark: 16}
    seg = segment({
      encoded: duplexer2(o, dec, enc),
      decoded: duplexer2(o, enc, dec),
      encodeErrors: errE,
      decodeErrors: errD,
    })
  }

  return seg

  function syncSafe(func, errs) {
    return function(data, e, cb) {
      try {
        cb(0, func(data))
      } catch (e) {
        errs.write(e)
        cb()
      }
    }
  }

  function asyncSafe(func, errs) {
    return function(data, e, cb) {
      var self = this
      func(data, function(err, result) {
        if (err) errs.write(err)
        else self.push(result)
        cb()
      })
    }
  }
}

codec.transform = function(opts, encode, decode) {
  if (arguments.length == 2) {
    decode = encode
    encode = opts
    opts = {}
  }

  opts.transform = true
  return codec(opts, encode, decode)
}

codec.duplex = function(opts, encode, decode) {
  if (arguments.length == 2) {
    decode = encode
    encode = opts
    opts = {}
  }

  opts.transform = false
  return codec(opts, encode, decode)
}
