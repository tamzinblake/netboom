var express = require('express')
  , netboom = require('./lib/netboom')

var app = express.createServer( express.bodyParser() )

app.use(express.favicon(__dirname + '/favicon.ico'))

app.get( '/js/*?'
       , function (req, res) {
           res.sendfile('htdocs/js/' + req.params[0])
         }
       )

app.get( '/css/*?'
       , function (req, res) {
           res.sendfile('htdocs/css/' + req.params[0])
         }
       )

app.get( '/netboom/:id'
       , function (req, res) {
           netboom.join(req, res, req.params.id)
         }
       )

app.listen(8080)
