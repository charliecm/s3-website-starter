/**
 * Build Script
 * Watches and generates the site's production files. Also starts a local
 * development server with livereload.
 */

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const chokidar = require('chokidar');
const ejs = require('ejs');
const connect = require('connect');
const serveStatic = require('serve-static');
const livereload = require('livereload');
const htmlMinify = require('html-minifier').minify;
const uglify = require('uglify-js').minify;
const {spawn} = require('child_process');
const config = require('./config.js');

const MANIFEST_PATH = config.manifest,
  SERVER_PATH = path.join(__dirname, config.dest),
  PORT = config.port,
  WATCH_FILES = '**/*.{js,css,css.map,ejs,txt,xml,jpg,jpeg,png,pdf,ico,svg}',
  DEFAULT_PRIORITY = 0.5,
  SASS_CONFIG = [
    '-r',
    '--output-style', 'compressed',
    '--source-map', config.css,
    '-o', config.css, config.css
  ];

var debug = false,
  watcher = null,
  manifest = null;

/**
 * Returns the sitemap content.
 * @param {Array} entries - Sitemap path entries.
 * @return {string} Sitemap content.
 */
function getSitemap(entries) {
  var header = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
    entryTemplate = _.template('\t<url><loc>' + config.url + '/<%= path %></loc><priority><%= priority %></priority></url>\n'),
    footer = '</urlset>',
    output = header;
  entries.forEach((entry) => {
    output += entryTemplate({
      path: entry.path,
      priority: entry.priority || DEFAULT_PRIORITY
    });
  });
  output += footer;
  return output;
}

/**
 * Generates a sitemap file.
 * @param {string} basePath - Output directory path.
 * @param {Array} entries - Sitemap path entries.
 */
function generateSitemap(basePath, entries) {
  var sitemapPath = path.join(basePath, 'sitemap.xml'),
    output = getSitemap(entries);
  fs.outputFile(sitemapPath, output, (err) => {
    if (err) return console.error(err);
    console.log(chalk.green('CREATED'), sitemapPath);
  });
}

/**
 * Compiles pages defined in the manifest.
 */
function compile() {
  var sitemapEntries = [];
  console.log(chalk.magenta('Compiling pages...'));
  // Add id field to each page object
  _.forOwn(manifest.pages, (page, pageID) => page.id = pageID);
  // Compile pages
  _.forOwn(manifest.pages, (page) => {
    var templatePath = path.join(config.src, page.template),
      outputPath = path.join(config.dest, page.output),
      data = _.assign({
        DEBUG: debug,
        pages: manifest.pages
      }, manifest.globals, page),
      content = null,
      output = '';
    // Read from template
    try {
      content = fs.readFileSync(templatePath, 'utf8');
    } catch (err) {
      console.error(chalk.red('ERROR'), err);
    }
    if (!content) return;
    // Compile EJS
    try {
      output = ejs.render(content, data, {
        filename: templatePath
      });
    } catch (err) {
      console.error(chalk.red('\nEJS ERROR'), err.stack);
      return;
    }
    // Minify HTML
    output = htmlMinify(output, {
      collapseWhitespace: true,
      minifyJS: true
    });
    // Create the page file
    fs.outputFile(outputPath, output, (err) => {
      if (err) return console.error(err);
      console.log(chalk.green('CREATED'), outputPath);
    });
    // Add page to sitemap entries
    sitemapEntries.push({
      path: page.output,
      priority: page.priority || ''
    });
  });
  // Generate sitemap
  generateSitemap(config.dest, sitemapEntries);
}

/**
 * Begins watch.
 */
function watch() {
  if (watcher) {
    watcher.close();
  }
  watcher = chokidar.watch(config.src + WATCH_FILES, { ignored: /[/\\]\./ }).on('all', (event, filePath) => {
    const ext = path.extname(filePath),
      dest = config.dest + filePath.substring(config.src.length);
    var output = '';
    if (event === 'change') {
      console.log(chalk.cyan('CHANGED'), filePath);
    } else if (event === 'unlink') {
      console.log(chalk.cyan('DELETED'), filePath);
    }
    switch (ext) {
      case '.css':
      case '.map':
      case '.xml':
      case '.txt':
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.svg':
      case '.pdf':
      case '.ico':
        if (ext === '.map' && !debug) return;
        if (event === 'unlink') {
          // Remove
          fs.remove(dest, (err) => {
            if (err) return console.error(err);
            console.log(chalk.red('DELETED'), dest);
          });
          return;
        }
        // Copy
        fs.copy(filePath, dest, (err) => {
          if (err) return console.error(err);
          console.log(chalk.green('CREATED'), dest);
        });
        break;
      case '.ejs':
        // Compile templates
        if (event === 'add') break;
        compile();
        break;
      case '.js':
        if (debug) {
          // Copy
          fs.copy(filePath, dest, (err) => {
            if (err) return console.error(err);
            console.log(chalk.green('CREATED'), dest);
          });
        } else {
          // Uglify JavaScript
          try {
            output = fs.readFileSync(filePath, 'utf8');
          } catch (err) {
            console.error(chalk.red('  ERROR'), err);
          }
          if (output) {
            output = uglify(output, { fromString: true, output: { comments: /^\/*!/ } }).code;
            fs.outputFile(dest, output, (err) => {
              if (err) return console.error(err);
              console.log(chalk.green('CREATED'), dest);
            });
          }
        }
        break;
    }
  });
}

/**
 * Updates the watcher based on manifest.
 */
function update() {
  try {
    delete require.cache[require.resolve(MANIFEST_PATH)];
    manifest = require(MANIFEST_PATH);
  } catch (err) {
    console.error(chalk.red('  ERROR'), err);
  }
  // Empty destination directory first
  fs.emptyDir(config.dest, (err) => {
    if (err) return console.error(err);
    console.log(chalk.yellow('EMPTIED'), config.dest);
    compile();
    watch();
  });
}

// Check for debug flag
process.argv.forEach(function(val) {
  if (val === '--debug') {
    debug = true;
    console.log(chalk.magenta('DEBUG MODE ENABLED'));
  }
});

// Watch manifest file
chokidar.watch(MANIFEST_PATH).on('all', (event) => {
  switch (event) {
    case 'unlink':
      console.warn(chalk.red('\nManifest not found.'));
      if (watcher) {
        watcher.close();
      }
      break;
    case 'change':
      console.log(chalk.cyan('\nManifest updated. Reseting watch...'));
      update();
      break;
    default:
      update();
      break;
  }
});

// Build and watch SASS
// TODO: Use node-sass JS API
// TODO: Make watch detect new SASS files
spawn('node-sass', SASS_CONFIG, { stdio: 'inherit' });
spawn('node-sass', SASS_CONFIG.concat(['-w']), { stdio: 'inherit' });

// Start server
connect().use(serveStatic(SERVER_PATH)).listen(PORT);
livereload.createServer().watch(SERVER_PATH);

// TODO: Have option to build once for deploy rather than watch
