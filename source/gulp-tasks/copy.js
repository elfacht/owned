/**
 * Copy JS modules
 */
var gulp = require('gulp');

module.exports = function () {
    var output =
      // Favicons etc.
      gulp
        .src(gulp.config.dev.hbs + '/*.png', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.base))
      gulp
        .src(gulp.config.dev.hbs + '/*.xml', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.base))
      gulp
        .src(gulp.config.dev.hbs + '/*.svg', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.base))
      gulp
        .src(gulp.config.dev.hbs + '/*.json', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.base))
      gulp
        .src(gulp.config.dev.hbs + '/*.ico', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.base))

      // Files
      gulp
        .src(gulp.config.dev.fonts + '/**/*', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.fonts))
      gulp
        .src(gulp.config.dev.gfx + '/**/*', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.gfx))
      gulp
        .src(gulp.config.dev.images + '/**/*', {allowEmpty: true})
        .pipe(gulp.dest(gulp.config.prod.images))
    return output;
};
