var levelup = require('levelup')
var leveljs = require('level-js')
var websocket = require('websocket-stream')
var sublevel = require('level-sublevel')
var multilevel = require('multilevel')
var createPersona = require('persona-id')
var request = require('browser-request')
var deleteRange = require('level-delete-range')

module.exports = function(options) {
  if (!options) options = {}
  if (!options.baseURL) options.baseURL = ''
  if (!options.dbName) options.dbName = "data"
  var db = sublevel(levelup(options.dbName, {
    db: leveljs,
    valueEncoding: 'json'
  }))
  return new User(db, options)
}

function User(db, options) {
  this.options = options
  this.db = db
  this.persona = createPersona()
  this.options = options
}

User.prototype.getProfile = function(cb) {
  var self = this
  var opts = { withCredentials: true, json: true, url: this.options.baseURL + '/_profile' }
  request(opts, function(err, resp, profile) {
    if (err) return cb(err, {})
    if (!profile.email) return cb(err, profile)
    self.db.put('profile', profile, function(err) {
      cb(err, profile)
    })
  })
}

User.prototype.destroy = function(subdb, cb) {
  var prefix = subdb.prefix()
  deleteRange(subdb, {start: prefix, end: prefix + '\xff'}, cb)
}

User.prototype.remote = function(name) {
  var backend = this.options.baseURL.replace('http:', 'ws:') + '/' + name
  var stream = websocket(backend)
  var db = multilevel.client()
  
  if (this.options.verbose) {
    db.on('data', function(e) { console.log(e) })
  }
  
  stream.on('error', function(e) {
    if (this.options.verbose) console.log('websocket error', e)
  })
  
  stream.pipe(db.createRpcStream()).pipe(stream)
  return db
}

User.prototype.copy = function(from, to, cb) {
  var read = from.createReadStream({valueEncoding: 'binary'})
  var write = to.createWriteStream({valueEncoding: 'binary'})
  if (this.options.verbose) {
    write.on('data', log)
    read.on('data', log)
    function log(c) { console.log('level-user', c) }
  }
  read.pipe(write)
  var sent = false
  write.on('close', function() {
    if (!sent) {
      cb()
      sent = true
    }
  })
  write.on('error', function(err) {
    if (!sent) {
      cb(err)
      sent = true
    }
  })
}
