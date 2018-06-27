/**
 * Concat JS incl. jshint
 */
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel');


module.exports = function() {
  var babelIgnore = [
    // gulp.config.dev.scripts + '/vendor/*.js', // exclude all plugins except foundation

  ];

  return gulp.src([
      gulp.config.dev.scripts + '/vendor/intersection-observer.js',
      gulp.config.dev.scripts + '/vendor/fontfaceobserver.js',
      gulp.config.dev.scripts + '/vendor/lozad.js',
      gulp.config.dev.scripts + '/app/helper.js',
      gulp.config.dev.scripts + '/app/scroller.js',
      gulp.config.dev.scripts + '/app/svg.js',
      gulp.config.dev.scripts + '/app.js'
    ])
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['/Users/elfacht/htdocs/_sandbox/craft-boiler/source/node_modules/babel-preset-es2016'],
      ignore: babelIgnore
    }))
    .pipe(concat('app.js'))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(gulp.config.prod.scripts));
};
