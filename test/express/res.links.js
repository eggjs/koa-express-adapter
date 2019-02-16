
var express = require('..');
var request = require('supertest');
const wrap = require('../../lib/wrap');
const wrap = require('../../lib/wrap');

describe('res', function(){
  describe('.links(obj)', function(){
    it('should set Link header field', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.links({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5'
        }));
        res.end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last"')
      .expect(200);
    })

    it('should set Link header field for multiple calls', async () =>{
      var app = new koa();

      app.use(wrap(function (req, res) {
        res.links({
          next: 'http://api.example.com/users?page=2',
          last: 'http://api.example.com/users?page=5'
        }));

        res.links({
          prev: 'http://api.example.com/users?page=1'
        }));

        res.end();
      }));

      await request(app.callback())
      .get('/')
      .expect('Link', '<http://api.example.com/users?page=2>; rel="next", <http://api.example.com/users?page=5>; rel="last", <http://api.example.com/users?page=1>; rel="prev"')
      .expect(200);
    })
  })
})
