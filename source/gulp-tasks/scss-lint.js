/**
 * Concat JS incl. jshint
 * @source https://www.npmjs.com/package/gulp-scss-lint
 */
var gulp = require('gulp'),
    scsslint = require('gulp-scss-lint');

module.exports = function() {
  return gulp.src(
    [
      gulp.config.dev.styles+'/**/*.scss',
      '!'+gulp.config.dev.styles+'/vendor/**/*.scss',
      '!'+gulp.config.dev.styles+'/_foundation-settings.scss',
      '!'+gulp.config.dev.styles+'/styleguide.scss'
    ])
    .pipe(scsslint({
      'config': './.scss-lint.yml',
      'maxBuffer': 307200
    }));
};
