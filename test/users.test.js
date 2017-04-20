'use strict';

const request = require('supertest');
const fsp = require('fs-promise');
const assert = require('assert');

describe('userz service tests', () => {
  let agent;

  before(async () => {
    // we have to clear directory before app is initialized
    await fsp.emptyDir('./users');
    agent = request.agent(require('../app'));
  });

  let auth = null;

  it('should register', (done) => {
    agent
    .post('/users/register')
    .send({
      name: 'Edsger W. Dijkstra',
      email: 'dijkstra@utexas.edu',
      luckyNumber: 42,
      password: 'g00dp4ss0rd',
    })
    .expect('content-type', /json/)
    .expect(200, done);
  });

  it('should reject registering with the same login', (done) => {
    agent
    .post('/users/register')
    .send({
      name: 'I am not Dijkstra',
      email: 'dijkstra@utexas.edu',
      luckyNumber: 40,
      password: 'fooo',
    })
    .expect(400, done);
  });

  it('should reject registering with the same lucky num', (done) => {
    agent
    .post('/users/register')
    .send({
      name: 'I am not Dijkstra',
      email: 'dijkstra@utexas.edu',
      luckyNumber: 42,
      password: 'fooo',
    })
    .expect(400, done);
  });

  it('should reject registering with missing name', (done) => {
    agent
    .post('/users/register')
    .send({
      email: 'dijkstra@utexas.edu',
      luckyNumber: 40,
      password: 'fooo',
    })
    .expect(400, done);
  });

  it('should not login with wrong password', (done) => {
    agent
    .post('/users/login')
    .send({
      email: 'dijkstra@utexas.edu',
      password: 'wrongpass',
    })
    .expect(403, done);
  });

  it('should login with good password', (done) => {
    agent
    .post('/users/login')
    .send({
      email: 'dijkstra@utexas.edu',
      password: 'g00dp4ss0rd',
    })
    .expect(200)
    .then((res) => {
      assert.ok(res.body.session);
      auth = res.body.session;
      done();
    });
  });

  it('should not query without auth header', (done) => {
    agent
    .post('/users/search')
    .send({ query: '.edu' })
    .expect(403, done);
  });

  it('should not query with wrong auth header', (done) => {
    agent
    .post('/users/search')
    .set('x-authorization', 'wrong')
    .send({ query: '.edu' })
    .expect(403, done);
  });

  it('should not query without query', (done) => {
    agent
    .post('/users/search')
    .send({ })
    .expect(400, done);
  });

  it('should be able to query with auth header', (done) => {
    agent
    .post('/users/search')
    .set('x-authorization', auth)
    .send({ query: '.edu' })
    .expect(200)
    .then((res) => {
      assert.ok(res.body.length);
      done();
    });
  });
});
