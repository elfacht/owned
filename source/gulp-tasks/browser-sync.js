/**
 * BrowserSync
 * @source https://www.browsersync.io/docs/gulp
 */
var gulp = require('gulp');

module.exports = function() {

  return gulp.bSync.init({
      proxy: gulp.defs.bsProxy,
      open: false,
      ghostMode: false
  });

};
