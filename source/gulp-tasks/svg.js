/**
 * @source https://github.com/ben-eb/gulp-svgmin
 */
var gulp = require('gulp'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    path = require('path');

module.exports = function() {
  var svgs = gulp
        .src(gulp.config.dev.svg + '/*.svg')
        .pipe(svgmin(function (file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: false
                    }
                },{
                    removeDoctype: true
                }, {
                    removeComments: true
                }, {
                    removeStyleElement: true
                },{
                    removeTitle: true
                },{
                    removeUselessDefs: true
                }, {
                    cleanupNumericValues: {
                        floatPrecision: 2
                    }
                }, {
                    convertColors: {
                        names2hex: false,
                        rgb2hex: false
                    }
                }]
            }
        }))
        .pipe(gulp.dest(gulp.config.dev.svg))
        .pipe(gulp.dest(gulp.config.prod.svg))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(rename({
            extname: ".html"
        }))
        .pipe(gulp.dest(gulp.config.dev.svg))
        .pipe(gulp.dest(gulp.config.prod.svg));

  function fileContents (filePath, file) {
    return file.contents.toString();
  }
};
