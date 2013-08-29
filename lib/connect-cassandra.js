/* jshint proto:false */
var util = require('util');

module.exports = function (connect) {
    var Store = connect.session.Store;
    var columnFamily = 'connect_session';
    var existingColumnFamilyException = 'Cannot add already existing column family';

    function CassandraStore(options) {
        var self = this;
        Store.call(self, options);
        self.pool = options.pool;
        self.pool.cql(util.format('create columnfamily %s (key text PRIMARY KEY)', columnFamily), [], function(e) {
            if(e && e.toString().indexOf(existingColumnFamilyException) == -1) {
                throw e;
            }
        });
    }

    CassandraStore.prototype.__proto__ = Store.prototype;

    CassandraStore.prototype.get = function (sid, callback) {
        var cql = util.format('select \'%s\' from %s where key = \'SESSIONS\'', sid, columnFamily);
        this.pool.cql(cql, [], function(err, result) {
            if(err) {
                return callback(err);
            }

            if(!result || result.length != 1) {
                return callback();
            }

            var sidColumn = result[0].get(sid);
            if(sidColumn === undefined) {
                return callback();
            }

            return callback(null, JSON.parse(sidColumn.value));
        });
    };

    CassandraStore.prototype.set = function (sid, session, callback) {
        var maxAge = session.cookie.maxAge;
        var ttl = ('number' == typeof maxAge ? maxAge / 1000 | 0 : 86400);
        session = JSON.stringify(session);
        var cql = util.format('update %s USING TTL %d set \'%s\' = ? where key = \'SESSIONS\'', columnFamily, ttl, sid);
        this.pool.cql(cql, [session], function(err) {
            callback(err);
        });
    };

    CassandraStore.prototype.destroy = function (sid, callback) {
         this.pool.cql(util.format('delete \'%s\' from %s where key = \'SESSIONS\'', sid, columnFamily), [], function(err) {
            callback(err);
        });
    };

    return CassandraStore;
};