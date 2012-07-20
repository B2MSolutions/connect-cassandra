var assert = require('assert'),
    connect = require('connect'),
    helenus = require('helenus'),
    CassandraStore = require('../lib/connect-cassandra.js')(connect);

var systempool = new helenus.ConnectionPool({
        hosts      : ['127.0.0.1:9160'],
        keyspace   : 'system'
});

var testpool = new helenus.ConnectionPool({
        hosts      : ['127.0.0.1:9160'],
        keyspace   : 'connect_cassandra_test'
});

var store = null;
var cookie = { cookie: { maxAge: 20000 }, name: 'cassandra' };
var sid = '123\\u';

describe('connect-cassandra', function() {
  before(function(done) {
    systempool.connect(function(e) {
      if(e) {
        return done(e);
      }
      systempool.cql('create keyspace connect_cassandra_test with strategy_class = \'NetworkTopologyStrategy\' AND strategy_options:datacenter1 = 1', [], function(e2) {
        if(e2) {
          return done(e2);
        }

        testpool.connect(done);
      });
    });
  });
  describe('#construction', function() {
    it('should not throw', function() {
      store = new CassandraStore({ pool: testpool });
    });
    it('should not error if columnfamily already exists', function() {
      var store2 = new CassandraStore({ pool: testpool });
    });
  });
  describe('#set', function() {
    it('should not throw', function(done) {
      store.set(sid, cookie, done);
    });
  });
  describe('#get', function() {
    it('should return cookie for existing sid', function(done) {
      store.get(sid, function(e, d) {
        assert.deepEqual(d, cookie);
        done(e);
      });
    });
    it('should return null for missing sid', function(done) {
      store.get('XXX', function(e, d) {
        assert.equal(d, null);
        done(e);
      });
    });
    it('should return null for expired sid', function(done) {
      this.timeout(10000);
      var expiringcookie = { cookie: { maxAge: 2000 }, name: 'cassandra' };
      store.set('expiring', expiringcookie, function() {
        store.get('expiring', function(e, d) {
          assert.deepEqual(d, expiringcookie);
          setTimeout(function() {
             store.get('expiring', function(e2, d2) {
              assert.equal(d2, null);
              done(e2);
            });
          }, 3000);
        });
      });
    });
  });
  describe('#destroy', function() {
    it('should return null for destroyed sid', function(done) {
      store.get(sid, function(e, d) {
        assert.deepEqual(d, cookie);
        store.destroy(sid, function(e2) {
          assert.equal(e2, null);
          store.get(sid, function(e3, d3) {
            assert.equal(d3, null);
            done(e3);
          });
        });
      });
    });
  });
  after(function(done) {
    testpool.close();
    systempool.cql('drop keyspace connect_cassandra_test', [], done);
  });
});