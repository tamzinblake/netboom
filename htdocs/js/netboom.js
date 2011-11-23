/* global Crafty imagesRoot*/
var devConsole
  , logConsole = function (config) {
      devConsole.innerHTML = 'x: ' + config.x + '<br>'
                           + 'y: ' + config.y + '<br>'
                           + 'health: ' + config.health + '<br>'
    }
window.onload = function () {
  devConsole = document.getElementById('dev_console')
  var defs = { fps: 60
             , panel: { xMin: 0
                      , xMax: 400
                      , yMin: 0
                      , yMax: 400
                      }
             , bullet: { v: 2.5
                       , components: [ '2D'
                                     , 'DOM'
                                     , 'Bullet'
                                     , 'bullet'
                                     , 'animate'
                                     , 'collision'
                                     ].join(',')
                       }
             , player: { w: 16
                       , h: 16
                       , components: [ '2D'
                                     , 'DOM'
                                     , 'player'
                                     , 'EnemyAI'
                                     , 'Character'
                                     , 'animate'
                                     , 'collision'
                                     ].join(',')
                       , attr: { x: 192
                               , y: 192
                               , z: 1
                               , v: 0
                               , rotation: 0
                               , vMax: 2
                               , vMin: .02
                               , rotAcc: 2
                               , linAcc: .5
                               , drag: .08
                               , shootDelay: 20
                               , shootSince: 0
                               , maxBullets: 8
                               , health: 20
                               }
                       , controls: { up   : Crafty.keys.UP_ARROW
                                   , down : Crafty.keys.DOWN_ARROW
                                   , left : Crafty.keys.LEFT_ARROW
                                   , right: Crafty.keys.RIGHT_ARROW
                                   , shoot: Crafty.keys.SPACE
                                   }
                       }
             }
  defs.player.attr.xMin = defs.panel.xMin
  defs.player.attr.xMax = defs.panel.xMax - defs.player.w + 1
  defs.player.attr.yMin = defs.panel.yMin
  defs.player.attr.yMax = defs.panel.yMax - defs.player.h + 1
  defs.player.xOrigin = defs.player.w/2+.5
  defs.player.yOrigin = defs.player.h/2+.5

  Crafty.init(defs.fps ,defs.panel.xMax ,defs.panel.yMax)
  Crafty.sprite( 16
               , imagesRoot + 'netboom.png'
               , { player: [0,0]
                 }
               )

  Crafty.sprite( 2
               , imagesRoot + 'bullet.png'
               , { bullet: [0,0]
                 }
               )

  Crafty.scene('loading' ,function() {
    Crafty.background('#fff')
    Crafty.e('2D ,DOM ,text')
    .attr({w: 100 ,h: 20 ,x: 150 ,y: 120})
    .text('Loading')
    .css({'text-align': 'center'})
    Crafty.load([imagesRoot + 'netboom.png', imagesRoot + 'bullet.png'] ,function() {
      Crafty.scene('main')
    })
  })

  Crafty.scene('main' ,function () {
    Crafty.c( 'CustomControls'
            , { _controls: copy(defs.player.controls)
              , CustomControls: function () {
                  var me = this
                  me._move = {}
                  var controls = me._controls
                  function keyHandler (me ,value) {
                    return function (e) {
                      var move = me._move
                      for (var p in controls) {
                        if (e.keyCode == controls[p]) move[p] = value
                      }
                    }
                  }
                  me.bind('keydown' ,keyHandler(me ,true))
                    .bind('keyup'   ,keyHandler(me ,false))
                  return me
                }
              }
            )

    Crafty.c( 'EnemyAI'
            , { _controls: copy(defs.player.controls)
              , EnemyAI: function () {
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
                      , rotation = Math.atan2(xDir, -yDir)/Math.PI*180
                    return me.align({rotation: rotation})
                  }
                  me.pursue = function (target) {
                    var xDist = target.x - me.x
                      , yDist = target.y - me.y
                      , dist  = Math.sqrt(xDist*xDist+yDist*yDist)
                    return dist < 16 ? -1 : dist > 32 ? 1 : 0
                  }
                  me.bind('enterframe' ,function (e) {
                    if (me.pause) return
                    var move = me._move
                    switch(me.face(player)) {
                      case -1: move.left = true  ;move.right = false ;break
                      case  0: move.left = false ;move.right = false ;break
                      case  1: move.left = false ;move.right = true  ;break
                    }
                    switch(me.pursue(player)) {
                      case -1: move.down = true  ;move.up = false ;break
                      case  0: move.down = false ;move.up = false ;break
                      case  1: move.down = false ;move.up = true  ;break
                    }
                    move.shoot = true
                  })
                  return me
                }
              }
            )

    Crafty.c( 'Bullet'
            , { Bullet: function () {
                  var me = this
                  me.die = function () {
                    me.parent.removeBullet(me)
                    me.destroy()
                  }
                  me.stepForward = function (step) {
                    me.rotation %= 360
                    me.y -= Math.sin((90+me.rotation)/180*Math.PI)*step
                    me.x -= Math.cos((90+me.rotation)/180*Math.PI)*step
                    return me
                  }
                  me.bind('enterframe' ,function (e) {
                    me.stepForward(me.v)
                    if ( me.x <= me.xMin
                      || me.x >= me.xMax
                      || me.y <= me.yMin
                      || me.y >= me.yMax
                       ) me.die()
                  })
                  return me
                }
              }
            )

    Crafty.c( 'Character'
            , { Character: function () {
                  var me = this
                  me._move = {}
                  me._bullets = []
                  me.removeBullet = function (bullet) {
                    me._bullets = me._bullets.filter(function (el, idx, arr) {
                                    return el !== bullet
                                  })
                  }
                  me.die = function () {
                    me.reset()
                  }
                  me.reset = function() {
                    for (var prop in defs.player.attr) {
                      me[prop] = defs.player.attr[prop]
                    }
                    me.x = Math.random()*(me.xMax-me.xMin)+me.xMin
                    me.y = Math.random()*(me.yMax-me.yMin)+me.yMin
                  }
                  me.shoot = function () {
                    if (me._bullets.length >= me.maxBullets) return
                    if (me.shootDelay > me.shootSince) return
                    var bullet = Crafty.e( defs.bullet.components
                                         )
                                 .attr({ x: me.x + me._origin.x-1
                                       , y: me.y + me._origin.y-1
                                       , rotation: me.rotation
                                       , xMin: defs.panel.xMin
                                       , yMin: defs.panel.yMin
                                       , xMax: defs.panel.xMax
                                       , yMax: defs.panel.yMax
                                       , v: defs.bullet.v
                                       , parent: me
                                       })
                                 .Bullet()
                                 .origin(1.5,1.5)
                                 .stepForward(me.w/2)
                    me._bullets.push(bullet)
                    me.shootSince = 0
                  }
                  me.bind('enterframe' ,function (e) {
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
                    if (me.health <= 0) me.die()
                    if (me.healthBar) healthBar.w = me.health
                    if (me.log) logConsole({x: me.x ,y: me.y ,health: me.health})
                  })
                  me.onHit('bullet' ,function (e) {
                    for (var i = 0 ;i < e.length ;i++) {
                      if (e[i].obj.parent[0] !== me[0]) {
                        me.health--
                        e[i].obj.die()
                      }
                    }
                  })
                  return me
                }
              }
            )

    var player = Crafty.e(defs.player.components + ',controls,CustomControls')
                 .attr(copy(defs.player.attr))
                 .CustomControls()
                 .Character()
                 .origin(defs.player.xOrigin ,defs.player.yOrigin)

    player.healthBar = true
    player.log = true

    player.reset()

    var enemy = Crafty.e(defs.player.components + ',EnemyAI')
                .attr(copy(defs.player.attr))
                .EnemyAI()
                .Character()
                .origin(defs.player.xOrigin ,defs.player.yOrigin)

    enemy.reset()

    var healthBar = Crafty.e('2D,DOM,Color,animate')
                    .attr({ x: defs.panel.xMax - defs.player.attr.health
                          , y: 0
                          , h: 4
                          , w: player.health
                          })
                    .color('#ff0000')

  })

  Crafty.scene('loading')
}

function copy (o) {
  var rv = {}
  for (var p in o) {
    rv[p] = o[p]
  }
  return rv
}
