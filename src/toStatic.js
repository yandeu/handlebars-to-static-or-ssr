var express = require('express')
var exphbs = require('express-handlebars')
var path = require('path')
var fs = require('fs')

var app = express()

var hbs = exphbs.create({
  extname: 'hbs',
  defaultLayout: 'main',
  partialsDir: 'partials',
  layoutsDir: 'layouts',
})

const rootView = '/home'
let pagesToCrawl = [{ view: rootView, crawled: false }]

const render = (_path) => {
  let view = _path || rootView
  //if (view === rootView) view = '/index'

  hbs
    .render(path.join(__dirname, `pages${view}.hbs`))
    .then((html) => {
      // console.log(html)

      setPageAsCrawled(view)

      // get all links to crawl
      const internalLinkRegexp = /href="(\/[\d\w\/-]+)"/gm
      let match = internalLinkRegexp.exec(html)
      while (match !== null && typeof match[1] === 'string') {
        const detectedUrl = match[1]
        if (
          pagesToCrawl.filter((page) => page.view === detectedUrl).length === 0
        )
          pagesToCrawl.push({ view: detectedUrl, crawled: false })

        match = internalLinkRegexp.exec(html)
      }

      // save to file
      let filePath = path.join(__dirname, '../www', view, 'index.html')
      filePath = filePath.replace(`${rootView}/index.html`, '/index.html')
      //console.log(filePath)

      ensureDirectoryExistence(filePath)
      fs.writeFile(filePath, html, (err) => {
        if (err) console.log(err)
        crawlNextPage()
      })

      // console.log(pagesToCrawl)
    })
    .catch((e) => {
      console.log('ERROR: ', e.message)
      setPageAsCrawled(view)
      crawlNextPage()
      //res.status(400).send('<h1>404 - Not Found</h1>')
    })
}

const setPageAsCrawled = (view) => {
  // set this page as crawled
  pagesToCrawl.forEach((page) => {
    if (page.view === view) page.crawled = true
  })
}

const ensureDirectoryExistence = (filePath) => {
  var dirname = path.dirname(filePath)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname, { recursive: true })
}

crawlNextPage = () => {
  // crawl next page if any
  if (pagesToCrawl.filter((view) => !view.crawled).length > 0) {
    const uncrawledUrls = pagesToCrawl.filter((view) => {
      return !view.crawled
    })
    const view = uncrawledUrls[0].view
    // console.log(view)
    render(view)
  }
  // all pages are crawled
  else {
    console.log(pagesToCrawl)
    process.exit()
  }
}

render()
