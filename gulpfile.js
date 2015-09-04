var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var directoryMap = require("gulp-directory-map");

gulp.task('browserify', function() {
	gulp.src('src/js/main.js')
		.pipe(browserify({transform: 'reactify'}))
		.on('error', errorHandler)
		.pipe(concat('main.js'))
		.on('error', errorHandler)
		.pipe(gulp.dest('dist/js'))
		.on('error', errorHandler);
});

gulp.task('copy-index', function() {
	gulp.src('src/index.html')
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-rss', function() {
	gulp.src('src/rss.xml')
		.pipe(gulp.dest('dist'));
});

gulp.task('copy-css', function() {
	gulp.src('src/css/*')
		.pipe(gulp.dest('dist/css'));
});

gulp.task('copy-images', function() {
	gulp.src('src/images/**/*')
		.pipe(gulp.dest('dist/images'));
});

gulp.task('copy-content', function() {
	gulp.src('src/content/**/*')
		.pipe(gulp.dest('dist/content'));
});

gulp.task('copy-misc', function() {
	gulp.src('src/misc/**/*')
		.pipe(gulp.dest('dist/misc'));
});

gulp.task('create-blogdirectory', function() {
	gulp.src('src/content/blog/*.md')
	  .pipe(directoryMap({
	    filename: 'blogentries.json'
	  }))
	  .pipe(gulp.dest('dist/content'));
});

gulp.task('default', ['browserify', 'copy-index', 'copy-rss', 'copy-css', 'copy-images', 'copy-content', 'copy-misc', 'create-blogdirectory'])
.on('error', errorHandler);

gulp.task('watch', function() {
	gulp.watch('src/**/*.*', ['default']);
});

function errorHandler (error) {
  console.log(error.toString());
  this.emit('end');
}
