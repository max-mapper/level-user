# level-user

**experimental**

client side library for authenticating with and moving data over a [level-socket](https://github.com/maxogden/level-socket) (authenticated binary websocket)

```
npm install level-user
```

## usage

```js
var user = require('level-user')({ dbName: 'blocks', baseURL: "http://localhost:8080" })
```

`baseURL` is where `level-socket` is running, `dbName` is the name of the `level-js` db data should be stored in

`user` has `.db` and `.persona`

### user.getSession(cb)

checks the users session state with the server, returns `{"loggedOut": "true"}` or the users profile object

### user.remote(remoteDbName)

returns a [multilevel](https://npmjs.org/package/multilevel) [sublevel](https://npmjs.org/package/level-sublevel) instance hooked up over a binary websocket to the `level-socket` backend.

### user.copy(from, to, cb)

pipes all data from `from` into `to`, overwriting any existing records in `to`.

example usage:

```js
var user = require('level-user')({dbName: 'blocks', baseURL: "http://localhost:8080" })
var local = user.db.sublevel('foo')
var remote = user.remote('foo')
user.copy(remote, local, function(err) {
  
})
```

TODO more docs

## license

BSD