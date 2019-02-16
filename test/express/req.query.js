'use strict';

const koa = require('koa'),
  request = require('supertest');
const wrap = require('../../lib/wrap');

describe('req', function() {
  describe('.query', function() {
    it('should default to {}', async () => {
      const app = createApp();

      await request(app.callback())
        .get('/')
        .expect(200, '{}');
    });

    it('should default to parse complex keys', async () => {
      const app = createApp();

      await request(app.callback())
        .get('/?user[name]=tj')
        .expect(200, '{"user":{"name":"tj"}}');
    });

    describe('when "query parser" is extended', function() {
      it('should parse complex keys', async () => {
        const app = createApp('extended');

        await request(app.callback())
          .get('/?user[name]=tj')
          .expect(200, '{"user":{"name":"tj"}}');
      });

      it('should parse parameters with dots', async () => {
        const app = createApp('extended');

        await request(app.callback())
          .get('/?user.name=tj')
          .expect(200, '{"user.name":"tj"}');
      });
    });

    describe('when "query parser" is simple', function() {
      it('should not parse complex keys', async () => {
        const app = createApp('simple');

        await request(app.callback())
          .get('/?user%5Bname%5D=tj')
          .expect(200, '{"user[name]":"tj"}');
      });
    });

    describe('when "query parser" is a function', function() {
      it('should parse using function', async () => {
        const app = createApp(function(str) {
          return { length: (str || '').length };
        });

        await request(app.callback())
          .get('/?user%5Bname%5D=tj')
          .expect(200, '{"length":17}');
      });
    });

    describe('when "query parser" disabled', function() {
      it('should not parse query', async () => {
        const app = createApp(false);

        await request(app.callback())
          .get('/?user%5Bname%5D=tj')
          .expect(200, '{}');
      });
    });

    describe('when "query parser" disabled', function() {
      it('should not parse complex keys', async () => {
        const app = createApp(true);

        await request(app.callback())
          .get('/?user%5Bname%5D=tj')
          .expect(200, '{"user[name]":"tj"}');
      });
    });

    describe('when "query parser fn" is missing', function() {
      it('should act like "extended"', async () => {
        const app = new koa();

        delete app.settings['query parser'];
        delete app.settings['query parser fn'];

        app.use(wrap(function(req, res) {
          res.send(req.query);
        }));

        await request(app.callback())
          .get('/?user[name]=tj&user.name=tj')
          .expect(200, '{"user":{"name":"tj"},"user.name":"tj"}');
      });
    });

    describe('when "query parser" an unknown value', function() {
      it('should throw', function() {
        createApp.bind(null, 'bogus').should.throw(/unknown value.*query parser/);
      });
    });
  });
});

function createApp(setting) {
  const app = new koa();

  if (setting !== undefined) {
    app.set('query parser', setting);
  }

  app.use(wrap(function(req, res) {
    res.send(req.query);
  }));

  return app;
}
