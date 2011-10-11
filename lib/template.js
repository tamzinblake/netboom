var siteConfig = require('./siteConfig')
  , yajet = new require('yajet')()
  , fs = require('fs')

var templates =
  { netboom : function() { return readTemplate('netboom') }
  , index   : function() { return readTemplate('index') }
  , error   : function() { return '404 not found' }
  }

function process (template, vars, ext) {
  yajet.compile(readTemplate('header'))
  yajet.compile(readTemplate('footer'))
  if (ext == 'extjs') {
    yajet.compile(readTemplate('extjs'))
  }
  return yajet.compile(templates[template || 'error']())(vars)
}

function readTemplate (name) {
  var filename = siteConfig.templateRoot + '/' + name + '.jt'
  return fs.readFileSync(filename, 'utf8')
}

this.process = process
