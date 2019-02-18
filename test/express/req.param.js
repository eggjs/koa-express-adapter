'use strict';

const koa = require('koa'),
  request = require('supertest');
const { wrap } = require('../..');

describe('req', function() {
  describe('.param(name, default)', function() {
    it('should use the default value unless defined', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.param('name', 'tj'));
      }));

      await request(app.callback())
        .get('/')
        .expect('tj');
    });
  });

  describe('.param(name)', function() {
    it('should check req.query', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.end(req.param('name'));
      }));

      await request(app.callback())
        .get('/?name=tj')
        .expect('tj');
    });

    it('should check req.body', async () => {
      const app = new koa();

      // app.use(express.json());

      app.use(wrap(function(req, res) {
        res.end(req.param('name'));
      }));

      await request(app.callback())
        .post('/')
        .send({ name: 'tj' })
        .expect('tj');
    });

    it('should check req.params', async () => {
      const app = new koa();

      app.get('/user/:name', wrap(function(req, res) {
        res.end(req.param('filter') + req.param('name'));
      }));

      await request(app.callback())
        .get('/user/tj')
        .expect('undefinedtj');
    });
  });
});
