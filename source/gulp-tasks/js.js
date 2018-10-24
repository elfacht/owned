/**
 * Concat JS incl. jshint
 */
var gulp = require('gulp'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify-es').default,
    rename = require('gulp-rename'),
    webpack = require('webpack-stream'),
    babel = require('gulp-babel');



module.exports = function() {
  var babelIgnore = [
    gulp.config.dev.scripts + '/vendor/*.js', // exclude all plugins except foundation

  ];

  return gulp.src([
      gulp.config.dev.scripts + '/main.js'
    ])
    .pipe(babel({
      ignore: babelIgnore
    }))
    .pipe(sourcemaps.init())
    .pipe(webpack({
          config : require('../webpack.config.js')
        }))
    .pipe(gulp.dest(gulp.config.prod.scripts))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(gulp.config.prod.scripts));
};
