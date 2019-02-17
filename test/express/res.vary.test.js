'use strict';

const koa = require('koa');
const request = require('supertest');
const wrap = require('../../lib/wrap');
const utils = require('../utils');

describe('res.vary()', function() {
  describe('with no arguments', function() {
    it('should not set Vary', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.vary();
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('Vary'))
        .expect(200);
    });
  });

  describe('with an empty array', function() {
    it('should not set Vary', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.vary([]);
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect(utils.shouldNotHaveHeader('Vary'))
        .expect(200);
    });
  });

  describe('with an array', function() {
    it('should set the values', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.vary([ 'Accept', 'Accept-Language', 'Accept-Encoding' ]);
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Vary', 'Accept, Accept-Language, Accept-Encoding')
        .expect(200);
    });
  });

  describe('with a string', function() {
    it('should set the value', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.vary('Accept');
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Vary', 'Accept')
        .expect(200);
    });
  });

  describe('when the value is present', function() {
    it('should not add it again', async () => {
      const app = new koa();

      app.use(wrap(function(req, res) {
        res.vary('Accept');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept-Encoding');
        res.vary('Accept');
        res.end();
      }));

      await request(app.callback())
        .get('/')
        .expect('Vary', 'Accept, Accept-Encoding')
        .expect(200);
    });
  });
});
