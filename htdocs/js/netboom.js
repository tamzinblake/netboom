window.onload = function () {
  Crafty.init(50, 400, 400)

  Crafty.scene('loading', function() {
    Crafty.background('#fff')
    Crafty.e('2D, DOM, text')
          .attr({w: 100, h: 20, x: 150, y: 120})
          .text('Loading')
          .css({'text-align': 'center'})
    Crafty.load(['sprite.png'], function() {
      Crafty.scene('main')
    })
  })

  Crafty.scene('main', function () {

  })

  Crafty.scene('loading')
}
