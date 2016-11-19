var gulp = require( 'gulp' ),
  sass = require( 'gulp-sass' ),
  argv = require( 'yargs' ).argv,
  browserSync = require( 'browser-sync' ),
  autoprefixer = require( 'gulp-autoprefixer' ),
  uglify = require( 'gulp-uglify' ),
  jshint = require( 'gulp-jshint' ),
  header = require( 'gulp-header' ),
  ifElse = require( 'gulp-if-else' ),
  rename = require( 'gulp-rename' ),
  cssnano = require( 'gulp-cssnano' ),
  concat = require( 'gulp-concat' ),
  sourcemaps = require( 'gulp-sourcemaps' ),
  newer = require( 'gulp-newer' ),
  imagemin = require( 'gulp-imagemin' ),
  runSequence = require( 'run-sequence' ),
  del = require( 'del' ),
  package = require( './package.json' );

// 1. paths
// 3. environment
// 2. config
// 4. banner
// 4. Tasks
// 4.a - html
// vendor CSS
// 4.b - Sass
// 4.e - vendor JavaScript
// 4.f - custom JavaScript
// 4.c - images
// 4.e - vendor fonts
// 4.d - fonts
// browser-sync
// clean
// watch

// CODE FOR CREATING MINIFIED DOCS FROM PHILL
var paths = {
  // for our production server
  'local': {
    'src': {
      'jslib': './lib/js/',
      'csslib': './lib/css/',
      'nm': './node_modules/',
      'bc': './bower_components/',
      'sass': './src/scss/',
      'js': './src/js/',
      'images': './src/img/',
      'html': './src/',
      'fonts': './src/fonts/'
    },
    'dist': {
      'css': './app/assets/css/',
      'js': './app/assets/js/',
      'images': './app/assets/img/',
      'fonts': './app/assets/fonts/',
      'html': './app/'
    }
  }
};

/**
 *
 * Environment Check
 *
 */

// are we working locally or on our production server?
var environment = argv.production;

function checkEnv() {
  var currentEnv;

  ifElse( environment, function() {
    currentEnv = paths.production;
  }, function() {
    currentEnv = paths.local;
  } );

  return currentEnv;
}

var currentEnv = checkEnv();


/**
 *
 * Config
 *
 */

var config = {
  vendorCssSrc: [
    // add all external css libraries here
    currentEnv.src.nm + 'font-awesome/css/font-awesome.css',
    currentEnv.src.nm + 'tether/dist/css/tether.css',
    currentEnv.src.nm + 'bootstrap/dist/css/bootstrap.css',
  ],
  vendorJsSrc: [
    // add all external js libraries here
    currentEnv.src.nm + 'jquery/dist/jquery.js',
    currentEnv.src.nm + 'tether/dist/js/tether.js',
    currentEnv.src.nm + 'bootstrap/dist/js/bootstrap.js',
    currentEnv.src.js + 'scripts.js',
  ],
  vendorFonts: [
    currentEnv.src.nm + 'font-awesome/fonts/'
  ]
}

var banner = [
  '/*!\n' +
  ' * <%= package.name %>\n' +
  ' * <%= package.title %>\n' +
  ' * <%= package.url %>\n' +
  ' * @author <%= package.author %>\n' +
  ' * @version <%= package.version %>\n' +
  ' * Copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
  ' */',
  '\n'
].join( '' );


/**
 *
 * HTML
 *
 */

gulp.task( 'html', function() {
  return gulp.src( currentEnv.src.html + '*.html' )
    .pipe( gulp.dest( currentEnv.dist.html ) );
} );
// TODAY FIXING GULP WATCH SASS
// gulp.task( 'sass', function() {
//   gulp.src( './sass/**/*.scss' )
//     .pipe( sass().on( 'error', sass.logError ) )
//     .pipe( gulp.dest( currentEnv.dist.css ) );
// } );

// vendor css

//build css lib scripts
gulp.task( 'compile-css-lib', function() {
  return gulp.src( config.vendorCssSrc )
    .pipe( concat( 'compiled-bundle.css' ) )
    .pipe( gulp.dest( currentEnv.dist.css ) )
    .pipe( rename( 'compiled-bundle.min.css' ) )
    .pipe( cssnano() )
    .pipe( gulp.dest( currentEnv.dist.css ) );
} );

//build js lib scripts
gulp.task( 'compile-js-lib', function() {
  return gulp.src( config.vendorJsSrc )
    .pipe( sourcemaps.init() )
    .pipe( concat( 'compiled-bundle.js' ) )
    .pipe( gulp.dest( currentEnv.dist.js ) )
    .pipe( rename( 'compiled-bundle.min.js' ) )
    .pipe( uglify() ).pipe( sourcemaps.write( './' ) )
    .pipe( gulp.dest( currentEnv.dist.js ) );
} );



gulp.task( 'css', function() {
  return gulp.src( 'src/scss/style.scss' )
    .pipe( sourcemaps.init() )
    .pipe( sass().on( 'error', sass.logError ) )
    .pipe( autoprefixer( 'last 4 version' ) )
    .pipe( gulp.dest( 'app/assets/css' ) )
    .pipe( cssnano() )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( header( banner, { package: package } ) )
    .pipe( sourcemaps.write() )
    .pipe( gulp.dest( 'app/assets/css' ) )
    .pipe( browserSync.reload( { stream: true } ) );
} );

gulp.task( 'js', function() {
  return gulp.src( 'src/js/scripts.js' )
    .pipe( sourcemaps.init() )
    .pipe( jshint( '.jshintrc' ) )
    .pipe( jshint.reporter( 'default' ) )
    .pipe( header( banner, { package: package } ) )
    .pipe( gulp.dest( 'app/assets/js' ) )
    .pipe( uglify() )
    .pipe( header( banner, { package: package } ) )
    .pipe( rename( { suffix: '.min' } ) )
    .pipe( sourcemaps.write() )
    .pipe( gulp.dest( 'app/assets/js' ) )
    .pipe( browserSync.reload( { stream: true, once: true } ) );
} );
/**
 *
 * Image Optimization
 *
 */

gulp.task( 'images', function() {
  // grab only the stuff in images with these extensions {png,jpg,gif,svg,ico}
  return gulp.src( currentEnv.src.images + '**/**/*.{png,jpg,gif,svg,ico}' )
    .pipe( newer( currentEnv.dist.images ) )
    .pipe( imagemin( {
      progressive: true
    } ) )
    .pipe( gulp.dest( currentEnv.dist.images ) );
} );

/**
 *
 * Fonts
 *
 */

// vendor fonts
gulp.task( 'vendorFonts', () => {
  return gulp.src( config.vendorFonts + '**/*.{woff,woff2,ttf}' )
    .pipe( gulp.dest( currentEnv.dist.fonts ) )
} )

// custom fonts
gulp.task( 'fonts', () => {
  return gulp.src( currentEnv.src.fonts + '**/*.{woff,woff2,ttf}' )
    .pipe( gulp.dest( currentEnv.dist.fonts ) )
} )

gulp.task( 'browser-sync', function() {
  browserSync.init( null, {
    // startPath: '/app/index.html',
    server: {
      baseDir: "app",
      routes: {
        "/node_modules": "node_modules",
        "/bower_components": "bower_components"
      }
    }
  } );
} );
gulp.task( 'bs-reload', function() {
  browserSync.reload();
} );

/**
 *
 * Watching
 *
 */

gulp.task( 'dist', () => {
  runSequence( [ 'html', 'css', 'js', 'images', 'vendorFonts', 'compile-js-lib', 'compile-css-lib' ], 'browser-sync' );
  // globbing
  // matches any file with a .scss extension in dist/scss or a child directory
  gulp.watch( currentEnv.src.sass + '**/*.scss', [ 'css' ] );
  gulp.watch( currentEnv.src.js + '*.js', [ 'js' ] );
  gulp.watch( currentEnv.src.html + '*.html', [ 'html', 'bs-reload' ] );
  gulp.watch( currentEnv.src.images + '**/**/*.{png,jpg,gif,svg,ico}', [ 'images' ] );
} );

// Synchronously delete the lib and dist folders with every gulp run
gulp.task( 'clean', del.bind( null, [ 'app' ] ) );

// // Clear caches off local system
// gulp.task( 'cache:clear', function( callback ) {
//   return cache.clearAll( callback )
// } );

// Cleaning up generated files automatically
// gulp.task( 'clean:dist', function() {
//   return del.sync( 'dist' );
// } );

gulp.task( 'default', [ 'clean' ], function() {
  gulp.start( 'dist' );
} );
