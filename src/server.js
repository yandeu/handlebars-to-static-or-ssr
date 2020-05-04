var express = require('express')
var exphbs = require('express-handlebars')

var reload = require('reload')

var http = require('http')
var path = require('path')

var app = express()

app.set('port', process.env.PORT || 3000)

var hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'main',
  partialsDir: 'partials',
  layoutsDir: 'layouts',
})

app.engine('hbs', hbs.engine)
app.set('view engine', 'hbs')

app.use('/static', express.static('public'))

// mock database
const heros = [
  { slug: 'hulk', name: 'Hulk', weapon: 'Monster' },
  { slug: 'captain-america', name: 'Captain America', weapon: 'Shield' },
  { slug: 'iron-man', name: 'Iron Man', weapon: 'Armor' },
]

// is dev?
const DEV = process.env.NODE_ENV === 'development'

app.get('/heros', function(req, res) {
  return res.render('heros', { DEV, heros })
})

app.get('/heros/:hero', function(req, res) {
  const { hero: name } = req.params
  const hero = heros.find((hero) => hero.slug === name)
  return res.render('hero', { DEV, hero })
})

app.get('*', function(req, res, next) {
  // check if it is a file (expect .html)
  if (/\.[\w]+(?<!html)$/.test(req.path)) return next()

  // get the path
  let view = req.path
  if (view === '/') view = '/home'

  // allow .html extension (including /index.html)
  if (view === '/index.html') view = '/home'
  if (/.html$/.test(view)) view = view.replace('.html', '')

  hbs
    .render(path.join(__dirname, `pages${view}.hbs`), {
      DEV,
    })
    .then((html) => {
      res.send(html)
    })
    .catch((e) => {
      console.log(e.message)
      res.status(400).send('<h1>404 - Not Found</h1>')
    })

  // res.render('home', { layout: false }, (err, html) => {
  //   res.send(html)
  // })
})

if (process.env.NODE_ENV === 'development') {
  var server = http.createServer(app)

  // Reload code here
  reload(app)
    .then(function(reloadReturned) {
      // reloadReturned is documented in the returns API in the README

      // Reload started, start web server
      server.listen(app.get('port'), function() {
        console.log(
          'Web server listening on port ' + app.get('port') + ' (dev mode)'
        )
      })
    })
    .catch(function(err) {
      console.error(
        'Reload could not start, could not start server/sample app',
        err
      )
    })
} else
  app.listen(app.get('port'), function() {
    console.log('Web server listening on port ' + app.get('port'))
  })
