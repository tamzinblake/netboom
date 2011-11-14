/* global require module */
var template = require('./template')

function join (req, res, id) {
  res.send(template.process( 'netboom'
                           , { title: 'Netboom'
                             , root: '/'
                             }
                           ))
}

module.exports =
  { join: join
  }
