/* global require module */
var template = require('./template')

function join (req ,res ,id) {
  res.send(template( 'netboom'
                   , { title: 'Netboom'
                     , root: '/netboom_pub'
                     }
                   ))
}

module.exports = { join: join
                 }
