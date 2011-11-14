/* global require module */
var routes = require('./lib/netboom')

function reroute (req ,res) {
  var path = split_params(req.params[0])
    , route = routes[path[1]]

  if (route == undefined) {
    route = routes['join']
    path[2] = path[1]
  }

  route(req ,res ,path)
}

function split_params (params) {
  if (params == undefined || params == '/') {
    return ['' ,'join']
  }
  else {
    return params.split(/\//)
  }
}

module.exports = { reroute: reroute
                 }
