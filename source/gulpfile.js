var gulp        = require('gulp'),
    source = require('vinyl-source-stream')
    runSequence = require('run-sequence'),
    taskLoader  = require('gulp-task-loader'),
    rename = require('gulp-rename');
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    buffer = require('vinyl-buffer'),
    browserSync = require('browser-sync'),
    log         = require('fancy-log'),
    chalk       = require('chalk'),
    critical    = require('critical'),
    replace     = require('gulp-replace'),
    pkg = require('./package.json'),
    reload = browserSync.reload;

gulp.bSync = require('browser-sync').create();

/**
 * config
 */

gulp.defs = {
  sourceFolder      : '../app/templates', // define source folder
  distFolder        : '../app/web', // define dist folder
  assetsFolder      : 'assets', // define assets folder
  cssFile           : 'app', // define CSS file name
  jsFile            : 'app', // define JS file name
  bsProxy           : 'craft-boiler.local'
}

gulp.config = {
    dev: {
        base     : gulp.defs.sourceFolder,
        scripts  : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/js',
        styles   : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/scss/',
        vendor   : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/js/vendor',
        svg_src  : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/svg_src',
        svg      : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/svg',
        images   : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/img',
        gfx      : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/gfx',
        fonts    : gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/fonts'
    },
    prod: {
        base   : gulp.defs.distFolder,
        scripts: gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/js',
        styles : gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/css',
        images : gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/img',
        gfx    : gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/gfx',
        fonts  : gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/fonts',
        svg    : gulp.defs.distFolder + '/' + gulp.defs.assetsFolder + '/svg'
    },
    vendor: {
      node_modules : 'node_modules'
    }
};

/**
 * Load all tasks from folder `gulp-tasks`
 */
taskLoader();


// Process the critical path CSS one at a time
function processCriticalCSS(element, i, callback) {
    const criticalSrc = pkg.urls.critical + element.url;
    const criticalDest = gulp.defs.sourceFolder + '/' + gulp.defs.assetsFolder + '/css/' + element.template + '_critical.min.css';

    log("-> Generating critical CSS: " + chalk.cyan(criticalSrc) + " -> " + chalk.magenta(criticalDest));
    critical.generate({
        src: criticalSrc,
        dest: criticalDest,
        inline: false,
        ignore: [],
        css: [
            gulp.config.prod.styles + '/app.css',
        ],
        minify: true,
        width: 1200,
        height: 1200
    }, (err, output) => {
        if (err) {
            log(chalk.magenta(err));
        }
        callback();
    });
}

// Process data in an array synchronously, moving onto the n+1 item only after the nth item callback
function doSynchronousLoop(data, processData, done) {
    if (data.length > 0) {
        const loop = (data, i, processData, done) => {
            processData(data[i], i, () => {
                if (++i < data.length) {
                    loop(data, i, processData, done);
                } else {
                    done();
                }
            });
        };
        loop(data, 0, processData, done);
    } else {
        done();
    }
}




//critical css task
gulp.task('criticalcss', (callback) => {
    doSynchronousLoop(pkg.globs.critical, processCriticalCSS, () => {
        // all done
        callback();
    });
});






/**
 * build without starting server
 */
gulp.task('build', ['copy', 'sass']);
gulp.task('build-live', ['copy', 'svg', 'sass', 'criticalcss']);

/**
 * starting server + watch task
 */
gulp.task('serve', ['build', 'watch', 'browser-sync']);

/**
 * watches for changes on files
 */
gulp.task('watch', function (cb) {

  // styles
  gulp.watch([
    gulp.config.dev.styles + '/**/*.scss',
    gulp.config.dev.base + '/styleguide/**/**/*.scss',
  ], ['sass', 'scss-lint']);

  // js
  gulp.watch([
    gulp.config.dev.base + '/partials/**/**/*.js',
    gulp.config.dev.scripts + '/**/*.js'

  ], ['js', 'copy']).on('change', gulp.bSync.reload);

  // html
  gulp.watch([
    gulp.config.dev.base + '/**/**/*.html'
  ]).on('change', gulp.bSync.reload);

  // static files
  gulp.watch([
    gulp.config.dev.images + '/**/*',
    gulp.config.dev.fonts + '/**/*',
    gulp.config.dev.json + '/**/*',
    gulp.config.dev.gfx + '/**/*'
  ], ['copy']);

});
