[![build status](https://secure.travis-ci.org/B2MSolutions/connect-cassandra.png)](http://travis-ci.org/B2MSolutions/connect-cassandra)
# connect-cassandra
A Cassandra session store for connect.

Re-uses a [helenus](https://github.com/simplereach/helenus) pool and creates a column family called connect_session to store the session in if required.

## Installation
	npm install connect-cassandra

## Usage
	var express = require('express'),
    helenus = require('helenus'),
    CassandraStore = require('connect-cassandra')(express);

	var pool = new helenus.ConnectionPool({
	    hosts      : ['127.0.0.1:9160'],
	    keyspace   : 'test'
	});

	pool.connect(function(e) {
		var app = express.createServer();
		app.use(express.cookieParser());
		app.use(express.session({ secret: 'supersecretkeygoeshere', store: new CassandraStore({ pool: pool })));
	});

## Contributors
Pair programmed by [Roy Lines](http://roylines.co.uk) and [James Bloomer](https://github.com/jamesbloomer).
