var gulp = require('gulp');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var cssbeautify = require('gulp-cssbeautify');
var rename = require('gulp-rename');
var minify = require('gulp-clean-css');
var notify = require('gulp-notify');

var successNotify = false;

var scripts = [
	"src/_js/Core/Mikit.js",
	"src/_js/Core/Mikit.Plugin.js",
	"src/_js/Core/Mikit.Animation.js",
	"src/_js/Core/Mikit.Detect.js",
	"src/_js/Core/Mikit.FormData.js",
	"src/_js/Core/Mikit.Response.js",
	"src/_js/Core/Mikit.Utils.js",
	"src/_js/Message/Mikit.Message.js",
	"src/_js/Sticky/Mikit.Sticky.js",
	"src/_js/Toggleme/Mikit.Toggleme.js",
	"src/_js/Offcanvas/Mikit.Offcanvas.js",
	"src/_js/Collapse/Mikit.Collapse.js",
	"src/_js/Dropdown/Mikit.Dropdown.js",
	"src/_js/Tab/Mikit.Tab.js",
	"src/_js/Modal/Mikit.Modal.js"
];

gulp.task('sass', function() {
    return gulp.src('src/mikit.scss')
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(cssbeautify({
            indent: '    ',
            openbrace: 'end-of-line',
            autosemicolon: true
        }))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename('mikit.min.css'))
        .pipe(minify())
        .pipe(gulp.dest('dist/css'))
        .pipe(notify(function(file) {  
            return successNotify && 'scss/sass compiled successfully!';  
        })); 
        
});

gulp.task('combine', function() {
    return gulp.src([
            'src/_scss/_variables.scss',
            'src/_scss/mixins/_breakpoint.scss',
            'src/_scss/mixins/_font.scss',
            'src/_scss/mixins/_flex.scss',
            'src/_scss/mixins/_grid.scss',
            'src/_scss/mixins/_button.scss',
            'src/_scss/mixins/_gradient.scss',
            'src/_scss/mixins/_badge.scss',
            'src/_scss/mixins/_utils.scss'
        ])
        .pipe(concat('mikit.scss'))
        .pipe(gulp.dest('dist/scss'))
        .pipe(notify(function(file) {  
            return successNotify && 'scss/sass combined successfully!';  
        })); 
});

gulp.task('scripts', function() {
    return gulp.src(scripts)
        .pipe(concat('mikit.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(rename('mikit.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist/js'))
        .pipe(notify(function(file) {  
            return successNotify && 'scripts compiled successfully!';  
        }));
});

gulp.task('watch', function() {

    gulp.watch(scripts, ['scripts']);
    gulp.watch(['src/_scss/*.scss', 'src/_scss/components/*.scss', 'src/_scss/mixins/*.scss'], ['sass', 'combine']);

});

gulp.task('default', ['sass', 'combine', 'scripts',  'watch']);
