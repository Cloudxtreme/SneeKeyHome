'use strict';

var Hapi = require('hapi'),
    Jwt = require('jsonwebtoken'),
    Fs = require('fs'),
    Bcrypt = require('bcrypt');

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8001 
});

function newGuid () {
    return server.plugins.bookshelf.knex.raw('select UUID() as newGuid').then(function (resp) {
        return resp[0][0].newGuid;
    });
}

server.register([
  {
    register: require('hapi-bookshelf-models'),
    options: {
      knex: JSON.parse(Fs.readFileSync('connection.json', 'utf8')),
      plugins: ['registry'],
      models: 'server/models'
    }
  }
], function (err) {
  if (typeof err !== 'undefined') {
        console.log('Error in connecting to MySQL DB: ' + err);
    }
});

var User = server.plugins.bookshelf.model('User');
var Session = server.plugins.bookshelf.model('Session');

// Add the route
server.route([
    {
        method: 'GET',
        path: '/hello', 
        handler: function (request, reply) {
            return reply('hello world');
        }
    },
    {
        method: 'GET',
        path: '/login/{username}/{password}',
        handler: function (request, reply) {
            var username = request.params.username;

            User.forge({ username: username }).fetch().then(function (user) {
                if (user) {
                    Bcrypt.compare(request.params.password, user.get('password'), function (err, res) {
                        if (err) {
                            console.log("ERROR: During login, encountered: " + err);
                        } else if (res) {
                            newGuid().then(function (token) {
                                Session.forge({ user: user.id, token: token }).save().then(function (session) {
                                    reply(Jwt.sign({ name: username }, session.get('token')));
                                });
                            });
                        }
                    });
                }
            });
        }
    },
    {
        method: 'GET',
        path: '/register/{username}/{password}',
        handler: function (request, reply) {
            var username = request.params.username;
            Bcrypt.hash(request.params.password, 10, function (err, hash) {
                User.forge({ username: username, password: hash }).save().then(function (user) {
                    reply(user);
                });
            });
        }
    }
]);

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});
