var gulp = require('gulp'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    sourcemaps = require('gulp-sourcemaps'),
    sassGlob = require('gulp-sass-glob');;

module.exports = function() {
  return gulp.src([
            gulp.config.dev.styles + '/*.scss'
          ])
          .pipe(sourcemaps.init({loadMaps: true}))
          .pipe(sassGlob())
          .pipe(sass({noCache: true, outputStyle: 'compressed'}))
          .pipe(autoprefixer())
          .pipe(sourcemaps.write('.'))
          .pipe(gulp.dest(gulp.config.prod.styles))
          .pipe(gulp.bSync.stream({ match: '**/*.css' }))
          // { match: '**/*.css' }
};
