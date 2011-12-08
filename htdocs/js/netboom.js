/* global Crafty imagesRoot */
var scoreboard
window.onload = function () {
  scoreboard = document.getElementById('scoreboard')

  /* global defs */

  var gameDefs = { xMin: 0 , xMax: 400
                 , yMin: 0 , yMax: 400
                 }
  var imagesFn = { player: imagesRoot + 'netboom.png'
                 , bullet: imagesRoot + 'bullet.png'
                 }

  /* init engine and sprite maps */

  Crafty.init(gameDefs.xMax ,gameDefs.yMax)
  Crafty.sprite( 16 , imagesFn.player
               , { player0: [0,0]
                 , player1: [0,1]
                 , player2: [0,2]
                 , player3: [0,3]
                 , player4: [0,4]
                 , player5: [0,5]
                 , player6: [0,6]
                 , player7: [0,7]
                 }
               )

  Crafty.sprite( 2 , imagesFn.bullet
               , { bullet: [0,0] }
               )

  /* scene definitions */

  Crafty.scene('loading' ,function () {
    Crafty.background('#ffffff')
    Crafty.e('2D ,DOM ,Text')
    .attr({w: 100 ,h: 20 ,x: 150 ,y: 120})
    .text('Loading')
    .css({'text-align': 'center'})
    Crafty.load([imagesFn.player ,imagesFn.bullet] ,function () {
      Crafty.scene('main')
    })
  })

  Crafty.scene('main' ,function () {

    var currentTick = {playerIds: []}

    scoreboard.update = function () {
      var scoreText = ''
      for (var i = 0 ;i < players.length ;i++) {
        scoreText += 'Player ' + i + ': ' + players[i].kills + '<br>'
      }
      scoreboard.innerHTML = scoreText
    }

    /* entity factories */

    function createPlayer (comp , pNum ,conf) {
      var attr = { x: 192 , y: 192 , z: 1 , v: 0
                 , rotation: 0
                 , vMax: 2 , vMin: .02
                 , rotAcc: 2 , linAcc: .5 , drag: .08
                 , shootDelay: 20 , shootSince: 0 , maxBullets: 8
                 , health: 8 , kills: 0
                 }
      var defs = { w: 16 , h: 16
                 , xOrigin: 8.5 , yOrigin: 8.5
                 }
      attr.xMin = gameDefs.xMin
      attr.xMax = gameDefs.xMax - defs.w + 1
      attr.yMin = gameDefs.yMin
      attr.yMax = gameDefs.yMax - defs.h + 1

      for (var p in conf) {
        attr[p] = conf[p]
      }
      return Crafty.e([ '2D' , 'DOM' , 'player' + pNum
                      , 'Character' , 'Animate' , 'Collision'
                      ].join(',') + (comp ? ',' + comp : ''))
             .attr(attr)
             .Character(attr)
             .origin(defs.xOrigin ,defs.yOrigin)
    }

    function createBullet (character ,conf) {
      var attr = { x: character.x + character._origin.x-1
                 , y: character.y + character._origin.y-1
                 , rotation: character.rotation
                 , xMin: gameDefs.xMin , yMin: gameDefs.yMin
                 , xMax: gameDefs.xMax , yMax: gameDefs.yMax
                 , v: 2.5
                 , owner: character
                 }
      for (var p in conf) {
        attr[p] = conf[p]
      }
      return Crafty.e( [ '2D' , 'DOM' , 'Bullet'
                       , 'bullet' , 'Animate' , 'Collision'
                       ].join(',')
                     )
             .attr(attr)
             .origin(1.5 ,1.5)
             .stepForward(character.w/2)
    }

    function applyTick (character, tick) {
      character.x = tick.x
      character.y = tick.y
      character.v = tick.v
      character.rotation = tick.rotation
      character.shootSince = tick.shootSince
      character.kills = tick.kills
    }

    /* Custom components */

    Crafty.c( 'CustomControls'
            , { _controls: { up   : Crafty.keys.UP_ARROW
                           , down : Crafty.keys.DOWN_ARROW
                           , left : Crafty.keys.LEFT_ARROW
                           , right: Crafty.keys.RIGHT_ARROW
                           , shoot: Crafty.keys.SPACE
                           , bigs : Crafty.keys.S
                           , mine : Crafty.keys.M
                           , erase: Crafty.keys.D
                           }
              , init: function () {
                  var me = this
                    , controls = me._controls
                    , move = me._move = {}
                  function filterBullets () {
                    var bullets = []
                    for (var i = 0 ;i < me._bullets.length ;i++) {
                      var bullet = me._bullets[i]
                      bullets.push({ x: bullet.x
                                   , y: bullet.y
                                   , v: bullet.v
                                   })
                    }
                    return bullets
                  }
                  me.bind('EnterFrame', function (e) {
                    $.getJSON( '/netboom/tick'
                             , { playerId: playerId
                               , playerData: { x: me.x , y: me.y , v: me.v
                                             , rotation: me.rotation
                                             , bullets: filterBullets()
                                             }
                               }
                             , function (json) {
                                 currentTick = json
                               }
                             )

                    for (var p in controls) {
                      if (me.isDown(controls[p])) {
                        move[p] = true
                      }
                      else {
                        move[p] = false
                      }
                    }
                  })
                  return me
                }
              }
            )

    Crafty.c( 'EnemyAI'
            , { init: function () {
                  var me = this
                  me._move = {}
                  me.align = function (target) {
                    var rotation = (target.rotation - me.rotation)
                    while (rotation >  180) rotation -= 360
                    while (rotation < -180) rotation += 360
                    return rotation < 0 ? -1 : rotation > 0 ? 1 : 0
                  }
                  me.face = function (target) {
                    var xDir = target.x - me.x
                      , yDir = target.y - me.y
                      , rotation = Math.atan2(xDir ,-yDir)/Math.PI*180
                    return me.align({rotation: rotation})
                  }
                  me.pursue = function (target) {
                    var xDist = target.x - me.x
                      , yDist = target.y - me.y
                      , dist  = Math.sqrt(xDist*xDist+yDist*yDist)
                    return dist < 16 ? -1 : dist > 32 ? 1 : 0
                  }
                  me.findTarget = function () {
                    return player
                  }
                  me.bind('EnterFrame' ,function (e) {
                    if (currentTick.playerIds[me.playerId] !== null) {
                      applyTick(me, currentTick.playerIds[me.playerId])
                      currentTick.playerIds[me.playerId] = null
                      return
                    }
                    if (me.pause) return
                    var move = me._move
                    var target = me.findTarget()
                    switch(me.face(target)) {
                      case -1: move.left = true  ;move.right = false ;break
                      case  0: move.left = false ;move.right = false ;break
                      case  1: move.left = false ;move.right = true  ;break
                    }
                    switch(me.pursue(target)) {
                      case -1: move.down = true  ;move.up = false ;break
                      case  0: move.down = false ;move.up = false ;break
                      case  1: move.down = false ;move.up = true  ;break
                    }
                    switch (Math.floor(Math.random()*60)) {
                      case 0: move.shoot = true  ;break
                      case 1: move.shoot = false ;break
                      case 2: move.mine  = true  ;break
                      case 3: move.mine  = false ;break
                      case 4: move.bigs  = true  ;break
                      case 5: move.bigs  = false ;break
                      case 6: move.erase = true  ;break
                      case 7: move.erase = false ;break
                    }
                  })
                  return me
                }
              }
            )

    Crafty.c( 'Bullet'
            , { init: function () {
                  var me = this
                  me.die = function () {
                    me.owner.removeBullet(me)
                  }
                  me.stepForward = function (step) {
                    me.rotation %= 360
                    me.y -= Math.sin((90+me.rotation)/180*Math.PI)*step
                    me.x -= Math.cos((90+me.rotation)/180*Math.PI)*step
                    return me
                  }
                  me.bind('EnterFrame' ,function (e) {
                    me.stepForward(me.v)
                    if ( (me.x <= me.xMin || me.x >= me.xMax)
                      || (me.y <= me.yMin || me.y >= me.yMax)
                       ) me.die()
                  })
                  return me
                }
              }
            )

    Crafty.c( 'Character'
            , { Character: function (defaultAttr) {
                  var me = this
                  me._bullets = []
                  me._defaultAttr = defaultAttr
                  me.removeBullet = function (bullet) {
                    me._bullets = me._bullets.filter(function (el ,idx ,arr) {
                                    return el !== bullet
                                  })
                    bullet.destroy()
                  }
                  me.erase = function () {
                    while (me._bullets.length) {
                      me._bullets.pop().destroy()
                    }
                  }
                  me.die = function () {
                    me.reset()
                  }
                  me.scoreKill = function () {
                    me.kills++
                    scoreboard.update()
                  }
                  me.reset = function() {
                    me.x = Math.random()*(me.xMax-me.xMin)+me.xMin
                    me.y = Math.random()*(me.yMax-me.yMin)+me.yMin
                    me.v = me._defaultAttr.v
                    me.rotation = me._defaultAttr.rotation
                    me.health = me._defaultAttr.health
                  }
                  me.shoot = function () {
                    if (me._bullets.length >= me.maxBullets) return
                    if (me.shootDelay > me.shootSince) return
                    var bullet = createBullet(me)
                    me._bullets.push(bullet)
                    me.shootSince = 0
                  }
                  me.bigs = function () {
                    if (me.shootDelay > me.shootSince) return
                    while (me._bullets.length < me.maxBullets) {
                      var bullet = createBullet(me)
                      me._bullets.push(bullet)
                    }
                    me.shootSince = 0
                  }
                  me.mine = function () {
                    if (me._bullets.length >= me.maxBullets) return
                    if (me.shootDelay > me.shootSince) return
                    var bullet = createBullet(me, {v: 0})
                    me._bullets.push(bullet)
                    me.shootSince = 0
                  }
                  me.bind('EnterFrame' ,function (e) {
                    var move = me._move
                    me.rotation += move.right ?  me.rotAcc
                                 : move.left  ? -me.rotAcc : 0
                    me.v += move.up   ?  me.linAcc
                          : move.down ? -me.linAcc : 0
                    me.v = Math.abs(me.v) < me.vMin ? 0 : me.v
                    me.v += me.v > 0 ? -me.drag
                          : me.v < 0 ?  me.drag : 0
                    me.v = me.v >  me.vMax ?  me.vMax
                         : me.v < -me.vMax ? -me.vMax : me.v
                    me.rotation %= 360
                    me.y -= Math.sin((90+me.rotation)/180*Math.PI)*me.v
                    me.x -= Math.cos((90+me.rotation)/180*Math.PI)*me.v
                    me.x = me.x <= me.xMin ? me.xMin+1
                         : me.x >= me.xMax ? me.xMax-1 : me.x
                    me.y = me.y <= me.yMin ? me.yMin+1
                         : me.y >= me.yMax ? me.yMax-1 : me.y
                    me.shootSince++
                    if (move.shoot) me.shoot()
                    if (move.bigs)  me.bigs()
                    if (move.mine)  me.mine()
                    if (move.erase) me.erase()
                    if (me.health <= 0) me.die()
                    if (me.healthBar) healthBar.w = me.health*2
                  })
                  me.onHit('bullet' ,function (e) {
                    for (var i = 0 ;i < e.length ;i++) {
                      if (e[i].obj.owner[0] !== me[0]) {
                        me.health--
                        if (me.health == 0) e[i].obj.owner.scoreKill()
                        e[i].obj.die()
                      }
                    }
                  })
                  return me
                }
              }
            )

    /* Create starting entities */

    var players = []

    var player = createPlayer('Keyboard,Controls,CustomControls', 0)
    player.healthBar = true
    player.reset()

    players.push(player)

    for (var i = 1; i <= 7; i++) {
      var enemy = createPlayer('EnemyAI', i)
      enemy.reset()
      players.push(enemy)
    }

    var healthBar = Crafty.e('2D,DOM,Color,Animate')
                    .attr({ x: gameDefs.xMax - player.health*2 , y: 0
                          , h: 4 , w: player.health*2
                          })
                    .color('#ff0000')

    scoreboard.update()
  })

  /* start the magic */

  Crafty.scene('loading')
}

function copy (o) {
  var rv = {}
  for (var p in o) {
    rv[p] = o[p]
  }
  return rv
}
