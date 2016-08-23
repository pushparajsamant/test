var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');
var replace = require('gulp-replace');
var fs = require('fs');
var clean = require('gulp-clean');

var paths = {
	sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
	gulp.src('./scss/ionic.app.scss')
		.pipe(sass({
			errLogToConsole: true
		}))
		.pipe(gulp.dest('./www/css/'))
		.pipe(minifyCss({
			keepSpecialComments: 0
		}))
		.pipe(rename({
			extname: '.min.css'
		}))
		.pipe(gulp.dest('./www/css/'))
		.on('end', done);
});

gulp.task('watch', function() {
	gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
	return bower.commands.install()
		.on('log', function(data) {
			gutil.log('bower', gutil.colors.cyan(data.id), data.message);
		});
});

gulp.task('git-check', function(done) {
	if (!sh.which('git')) {
		console.log(
			'  ' + gutil.colors.red('Git is not installed.'),
			'\n  Git, the version control system, is required to download Ionic.',
			'\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
			'\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
		);
		process.exit(1);
	}
	done();
});


/*Create logging*/
gulp.task('log-misfit', function() {
	if (!gutil.env.y && !gutil.env.n) {
		throw new gutil.PluginError({
			plugin: "log-misfit",
			message: "***ERROR: Set option of gulp log-misfit --y | --n"
		});
		return;
	}
	var htmlkey = "<!--<DO NOT REMOVE: FOR MISFIT LOGGING>//-->";
	var htmlreplaceStr = "<script src='js/LogMisFitService.js'></script>";

	var servicekey = "/*--<DO NOT REMOVE: FOR MISFIT LOGGING - INJECTOR>//--*/";
	var serviceReplaceStr = "var LogMisFitService = $injector.get('LogMisFitService');";

	var serviceImpkey = "/*--<DO NOT REMOVE: FOR MISFIT LOGGING - IMPLEMENTATION>//--*/";
	var serviceImpReplaceStr = "LogMisFitService.log(syncData, label, deviceInfo);";

	var filePathIndex = './www/index.html';
	var filePathController = './www/js/controllers.js';

	if (gutil.env.y) {
		fs.readFile(filePathIndex, "utf-8", function(err, data) {
			if (data.indexOf(htmlkey) == -1) {
				throw new gutil.PluginError({
					plugin: "log-misfit",
					message: "***ERROR: " + filePathIndex + " does not have " + htmlkey
				});
			} else{
				fs.readFile(filePathController, "utf-8", function(err, data) {
					if (data.indexOf(servicekey) == -1) {
						throw new gutil.PluginError({
							plugin: "log-misfit",
							message: "***ERROR: " + filePathController + " does not have " + servicekey
						});
					}else if (data.indexOf(serviceImpkey) == -1) {
						throw new gutil.PluginError({
							plugin: "log-misfit",
							message: "***ERROR: " + filePathController + " does not have " + serviceImpkey
						});
					}else if (data.indexOf("$injector") == -1) {
						throw new gutil.PluginError({
							plugin: "log-misfit",
							message: "***ERROR: $injector is not defined in the controller thus LogMisFitService cannot be included"
						});
					}else{
						/* Copy log service to www/js/services */
						gulp.src(['./config/log/LogMisFitService.js'])
							.pipe(gulp.dest('www/js'));

						/* Include the log service file */
						gulp.src([filePathIndex])
							.pipe(replace(htmlkey, htmlreplaceStr))
							.pipe(gulp.dest('./www'));

						/*TODO: to add in the line where we want to log*/
						/* Place: LogMisFitService.log() */
						gulp.src([filePathController])
							.pipe(replace(servicekey, serviceReplaceStr))
							.pipe(replace(serviceImpkey, serviceImpReplaceStr))
							.pipe(gulp.dest('./www/js'));
					}
				});
}			
		});

	} else {
		/* Remove log service to www/js/services */
		gulp.src('./www/js/LogMisFitService.js', {
				read: false
			})
			.pipe(clean({
				force: true
			}));

		/* Change the log service file back to comment*/
		gulp.src([filePathIndex])
			.pipe(replace(htmlreplaceStr, htmlkey))
			.pipe(gulp.dest('./www'));

		/*TODO: to add in the line where we want to log*/
		/* Remove and replcae with comment */
		gulp.src([filePathController])
			.pipe(replace(serviceReplaceStr, servicekey))
			.pipe(replace(serviceImpReplaceStr, serviceImpkey))
			.pipe(gulp.dest('./www/js'));
	}
});
