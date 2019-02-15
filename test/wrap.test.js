'use strict';

const request = require('supertest');
const { wrap } = require('..');
const utils = require('./utils');

describe('test/wrap.test.js', () => {
  let app;

  it('should support express', async () => {
    app = utils.createApp();
    app.use(wrap(function(req, res) {
      res.send('a');
    }));

    await request(app.callback())
      .get('/')
      .expect('a')
      .expect(200);
  });

  it('should support express with next', async () => {
    app = utils.createApp();
    app.use(wrap(function(req, res, next) {
      setTimeout(() => {
        next();
      }, 1000);
    }));
    app.use(wrap(function(req, res) {
      res.send('a');
    }));
    app.use(wrap(function(req, res) {
      res.send('b');
    }));

    await request(app.callback())
      .get('/')
      .expect('a')
      .expect(200);
  });

  it('should support express with error', async () => {
    app = utils.createApp();
    app.use(wrap(function(req, res, next) {
      setTimeout(() => {
        next(new Error('error'));
      }, 1000);
    }));

    await request(app.callback())
      .get('/')
      .expect(/Error: error/)
      .expect(500);
  });
});
