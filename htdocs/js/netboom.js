/* global Crafty */
window.onload = function () {
  var defs = { fps: 60
             , panel: { xMin: 0
                      , xMax: 400
                      , yMin: 0
                      , yMax: 400
                      }
             , player: { w: 16
                       , h: 16
                       , attr: { x: 192
                               , y: 192
                               , z: 1
                               , v: 0
                               , rotation: 0
                               , vMax: 5
                               , vMin: .2
                               , rotAcc: 2
                               , linAcc: 1
                               , drag: .2
                               , shootDelay: 30
                               , shootSince: 0
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
               , '/netboom_pub/images/netboom.png'
               , { player: [0,0]
                 , bullet: [0,1]
                 }
               )

  Crafty.scene('loading' ,function() {
    Crafty.background('#fff')
    Crafty.e('2D ,DOM ,text')
    .attr({w: 100 ,h: 20 ,x: 150 ,y: 120})
    .text('Loading')
    .css({'text-align': 'center'})
    Crafty.load(['/netboom_pub/images/netboom.png'] ,function() {
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
                        if (e.keyCode == controls[p]) move[p] = value;
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
                    move.shoot = true;
                  })
                  return me
                }
              }
            )

    Crafty.c( 'Bullet'
            , { Bullet: function () {
                  var me = this
                  me.die = function () {
                    me.destroy()
                  }
                  me.bind('enterframe' ,function (e) {
                    me.rotation %= 360
                    me.y -= Math.sin((90+me.rotation)/180*Math.PI)*me.v
                    me.x -= Math.cos((90+me.rotation)/180*Math.PI)*me.v
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
                  me.shoot = function () {
                    var bullet = Crafty.e( '2D'
                                         , 'DOM'
                                         , 'Bullet'
                                         , 'bullet'
                                         , 'animate'
                                         , 'collision'
                                         )
                                 .attr({ x: me.x
                                       , y: me.y
                                       , rotation: me.rotation
                                       , xMin: defs.panel.xMin
                                       , yMin: defs.panel.yMin
                                       , xMax: defs.panel.xMax
                                       , yMax: defs.panel.yMax
                                       , v: 10
                                       , parent: me
                                       })
                                 .Bullet()
                                 .origin(1,1)
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
                    if (move.shoot && me.shootDelay < me.shootSince) me.shoot()
                  })
                  return me
                }
              }
            )

    var player = Crafty.e( '2D'
                         , 'DOM'
                         , 'player'
                         , 'controls'
                         , 'CustomControls'
                         , 'Character'
                         , 'animate'
                         , 'collision'
                         )
                 .attr(copy(defs.player.attr))
                 .CustomControls()
                 .Character()
                 .origin(defs.player.xOrigin ,defs.player.yOrigin)

    var enemy = Crafty.e( '2D'
                        , 'DOM'
                        , 'player'
                        , 'EnemyAI'
                        , 'Character'
                        , 'animate'
                        , 'collision'
                        )
                .attr(copy(defs.player.attr))
                .EnemyAI()
                .Character()
                .origin(defs.player.xOrigin ,defs.player.yOrigin)

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
