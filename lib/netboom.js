/* global require module */
var template = require('./template')
  , idSeq = 1
  , games = []

function findGame () {
  for (var i = 0 ;i < games.length ;i++) {
    if (games[i].length < 8) {
      return games[i]
    }
  }
  var game = {id: i ,players: [] ,playerIds: {}}
  games.push(game)
  return game
}

function join (req ,res ,id) {
  var playerId = idSeq++
    , game = findGame()
    , player = { id: playerId }

  game.playerIds[playerId] = player
  game.players.push(player)

  res.send(template( 'netboom'
                   , { title: 'Netboom'
                     , root: '/netboom_pub'
                     , game: game
                     , playerId: playerId
                     }
                   ))
}

function quit (req ,res ,id) {
  for (var i = 0 ;i < games.length ;i++) {
    games[i].players = games[i].players.filter(function (el ,idx ,arr) {
                         return el.id == id
                       })
  }
}

function tick (req, res, id) {
  var playerId = req.body.playerId
    , playerData = req.body.playerData
    , player = games[id].playerIds[playerId]

  for (var p in playerData) {
    player[p] = playerData[p]
  }
  res.send(games[id])
}

module.exports = { join: join
                 , quit: quit
                 , tick: tick
                 }
