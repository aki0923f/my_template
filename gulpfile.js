//package
const gulp         = require('gulp'),
  fs               = require('fs'),
  ejs              = require('gulp-ejs'),
  sass             = require('gulp-sass'),
  connectSsi       = require('connect-ssi'),
  crlf             = require('gulp-cr-lf-replace'),
  csscomb          = require('gulp-csscomb'),
  browserSync      = require('browser-sync').create(),
  imagemin         = require('gulp-imagemin'),
  notify           = require('gulp-notify'),
  pleeease         = require('gulp-pleeease'),
  plumber          = require('gulp-plumber'),
  pngquant         = require('imagemin-pngquant'),
  rename           = require('gulp-rename'),
  runSequence      = require('run-sequence');

// path
const DEV_ROOT_PATH = './_htdocs/',
      PUB_ROOT_PATH = './htdocs/';

/**
 * build
 *
 */
// CSS
gulp.task('build:css', function () {
  return gulp.src(DEV_ROOT_PATH + '**/*.scss')
    .pipe(plumber({
      errorHandler: notify.onError('Error on <gulp sass>: <%= error.message %>')
    }))
    .pipe(sass())
    .pipe(csscomb())
    .pipe(pleeease({
      autoprefixer: {
        browsers: ['iOS 8', 'Android 4.0', 'Firefox 48', 'last 2 version']
      },
      opacity: true,
      minifier: false,
      outputStyle: 'expanded'
    }))
    .pipe(crlf({
      changeCode: 'CR+LF'
    }))
    .pipe(notify('Complete <gulp sass>'))
    .pipe(gulp.dest(PUB_ROOT_PATH));
});

// html・JS
gulp.task('build:html_js', function () {
  return gulp.src(DEV_ROOT_PATH + '**/*.+(html|js)')
    .pipe(gulp.dest(PUB_ROOT_PATH));
});

gulp.task('build:ejs', function() {
  let json = JSON.parse(fs.readFileSync(DEV_ROOT_PATH + 'ejs/config.json'));
  gulp.src([DEV_ROOT_PATH + '**/*.ejs', '!' + DEV_ROOT_PATH + '**/_*.ejs'])
    .pipe(ejs({json: json}, {}, {"ext": ".html"}))
    .pipe(rename({
      extname: '.html'
    }))
    // .pipe(crlf({
    //   changeCode: 'CR+LF'
    // }))
    .pipe(gulp.dest(PUB_ROOT_PATH));
});


/**
 * optimizeImage
 * 画像を軽量化する
 */
gulp.task('optimizeImage', function () {
  gulp.src(DEV_ROOT_PATH + '**/*.+(jpg|gif|png)')
    .pipe(plumber({
      errorHandler: notify.onError('Error on <gulp optimizeImage>: <%= error.message %>')
    }))
    .pipe(imagemin({
      use: [
        pngquant({
          quality: 60 - 80,
          speed: 1
        })
      ]
    }))
    .pipe(gulp.dest(PUB_ROOT_PATH))
    .pipe(notify('Complete <gulp optimizeImage>'));
});


/**
 * browser reload
 *
 */
gulp.task('browserReload', function () {
  browserSync.reload();
  notify('Browser Reloaded');
});

/**
 * browser sync
 *
 */
gulp.task('browserSync', function () {
  return browserSync.init(null, {
    server: {
      baseDir: PUB_ROOT_PATH,
      port: 3001,
      // setting SSI
      middleware: [
        connectSsi({
          baseDir: PUB_ROOT_PATH,
          ext: '.html'
        })
      ]
    },
    startPath: '/index.html',
    open: 'external',
    notify: false
  });
});


/**
 * publish
 *
 */
// HTML
gulp.task('publish:html_js', function () {
  return runSequence(
    ['build:html_js', 'build:ejs'],
    // ['build:html_js'],
    'browserReload'
  );
});

gulp.task('publish:css', function () {
  return runSequence(
    ['build:css'],
    'browserReload'
  );
});

gulp.task('publish:img', function () {
  return runSequence(
    ['optimizeImage'],
    'browserReload'
  );
});

/**
 * watch
 * 自動で書きだす
 */
gulp.task('watch', function () {
  gulp.watch(DEV_ROOT_PATH + '**/*.scss', ['publish:css']);
  gulp.watch(DEV_ROOT_PATH + '**/*.+(html|js)', ['publish:html_js']);
  gulp.watch(DEV_ROOT_PATH + '**/*.ejs', ['publish:html_js']);
  // gulp.watch(DEV_ROOT_PATH + '**/*.+(jpg|gif|png)', ['publish:img']);
  //gulp.watch(PUB_ROOT_PATH + '**/*', ['browserReload']);
});

gulp.task('default', function () {
  return runSequence(
    'browserSync',
    'publish:css',
    'publish:html_js',
    // 'publish:img',
    'watch'
  );
});
