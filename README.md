# The adapter for the migration from express to koa

If you have search the two framework on npm, you will get 16k+ (express) and 4k+ (koa). express has a bigger ecosystem than koa, This package will let you use express middleware in koa application.

## Badges

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/koa-express-adapter.svg?style=flat-square
[npm-url]: https://npmjs.org/package/koa-express-adapter
[travis-image]: https://img.shields.io/travis/popomore/koa-express-adapter.svg?style=flat-square
[travis-url]: https://travis-ci.org/popomore/koa-express-adapter
[codecov-image]: https://codecov.io/gh/popomore/koa-express-adapter/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/popomore/koa-express-adapter
[download-image]: https://img.shields.io/npm/dm/koa-express-adapter.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa-express-adapter

## Usage

You can simply wrap express middleware with `wrap` function.

```js
const { wrap } = require('koa-express-adapter');
const Koa = require('koa');
const app = new Koa();
// wrap express middleware
app.use(wrap(function(req, res) {
  res.send('Hello World');
}));
```

**Note: Don't define next argument when you don't use it.**

```js
// it's wrong
app.use(wrap(function(req, res, next) {
  res.send('Hello World');
}));
```

## Express API

### Request

- [x] accepts
- [x] acceptsCharset
- [x] acceptsCharsets
- [x] acceptsEncoding
- [x] acceptsEncodings
- [x] acceptsLanguage
- [x] acceptsLanguages
- [ ] baseUrl
- [ ] fresh
- [x] get
- [x] hostname
- [x] host
- [x] ip
- [x] ips
- [x] is
- [ ] param
- [x] path
- [x] protocol
- [x] query
- [ ] range
- [ ] route
- [ ] secure
- [ ] signedCookies
- [ ] stale
- [ ] subdomains
- [ ] xhr

### Response

- [ ] append
- [x] attachment
- [x] clearCookie
- [x] cookie
- [ ] download
- [ ] format
- [x] get
- [x] json
- [ ] jsonp
- [ ] links
- [x] locals
- [x] location
- [x] redirect
- [ ] render
- [x] send
- [ ] sendFile
- [x] sendStatus
- [x] set
- [x] status
- [x] type
- [x] vary

## Testcase

Thanks for [express testcase](https://github.com/popomore/koa-express-adapter/tree/first/test/express) for compatible unittest.

## License

(The MIT License)
