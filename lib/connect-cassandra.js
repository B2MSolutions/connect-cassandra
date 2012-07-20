/* jshint proto:false */
var util = require('util');

module.exports = function (connect) {
    var Store = connect.session.Store;
    var columnFamily = 'connect_session';

    function CassandraStore(options) {
        var self = this;
        Store.call(self, options);
        self.pool = options.pool;

        self.pool.cql(util.format('select * from %s limit 1', columnFamily), [], function(e1) {
            if(e1) {
                self.pool.cql(util.format('create columnfamily %s (key text PRIMARY KEY)', columnFamily), [], function(e2) {
                    if(e2) {
                        throw err;
                    }
                });
            }
        });
    }

    CassandraStore.prototype.__proto__ = Store.prototype;

    CassandraStore.prototype.get = function (sid, callback) {
        this.pool.cql(util.format('select %s from %s where key = \'SESSIONS\'', sid, columnFamily), [sid], function(err, result) {
            if(err) {
                return callback(err);
            }

            if(result.length != 1) {
                return callback();
            }

            return callback(null, JSON.parse(result[0].get(sid).value));
        });
    };

    CassandraStore.prototype.set = function (sid, session, callback) {
        var maxAge = session.cookie.maxAge;
        var ttl = ('number' == typeof maxAge ? maxAge / 1000 | 0 : 86400);
        session = JSON.stringify(session);
        this.pool.cql(util.format('update %s set %s = ? where key = \'SESSIONS\' USING TTL %d', columnFamily, session, ttl), [sid], function(err) {
            callback(err);
        });
    };

    CassandraStore.prototype.destroy = function (sid, callback) {
         this.pool.cql(util.format('delete %s from %s where key = \'SESSIONS\'', sid, columnFamily), [], function(err) {
            callback(err);
        });
    };

    return CassandraStore;
};