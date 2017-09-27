'use strict';
var fs = require('fs');
var gulp = require('gulp');
var minifyHtml = require('gulp-htmlmin');
var minifyCss = require("gulp-minify-css");
// var minifyJs = require('gulp-uglify');
var composer = require('gulp-uglify/composer');
var minifyJsEs6 = require('uglify-es');
var clean = require('gulp-clean');
var rename = require("gulp-rename");
var concat = require('gulp-concat');
var gutil = require('gulp-util');

var minifyJs = composer(minifyJsEs6, console);

gulp.task('js', ['workerjs'], function () {
    return gulp.src(['./src/js/*.js', './src/index.js'])
        .pipe(concat('index.js'))
        .pipe(minifyJs())
        .pipe(gulp.dest('dist/'));
});

gulp.task('workerjs', ['subworkerjs'], function () {
    return gulp.src(['./dist/js/worker/worker.js'], {base: 'dist'})
        .pipe(minifyJs({}))
        .pipe(gulp.dest('dist/'));
});

gulp.task('subworkerjs', ['copy'], function () {
    // 压缩 webworker
    var fileContent = fs.readFileSync('./src/js/worker/worker.js', 'utf8');
    var firstLine = fileContent.split(/\r?\n/)[0];
    var subWorkers = firstLine.match(/(\w+?\.js)/g);
    subWorkers.forEach((ele, index, arr) => arr[index] = './src/js/worker/' + ele);
    var reg = /importScripts\((.+)\);/;
    var resultContent = fileContent.replace(reg, 'importScripts(\'subworkers.js\', \'../../defaults/basefuncs.js\');');
    fs.writeFileSync('dist/js/worker/worker.js', resultContent, 'utf8');
    return gulp.src(subWorkers)
        .pipe(concat('subworkers.js'))
        .pipe(minifyJs({}))
        .pipe(gulp.dest('dist/js/worker'));
});

gulp.task('copy', ['beforecopy'], function () {
    return gulp.src([
        './src/assets/jquery.min.js',
        './src/assets/noty.js',
        './src/assets/bootstrap/**',
        './src/assets/ace-min/ace.js',
        './src/assets/ace-min/*-javascript.js',
        './src/assets/ace-min/theme-*.js',
        './src/js/worker/worker.js',
        './src/defaults/*',
    ], {base: "src"})
        .pipe(gulp.dest('dist/'));
});

gulp.task('beforecopy', function () {
    // 生成 defaults.json
    var files = fs.readdirSync('./src/defaults/');
    var list = [];
    files.forEach(function (filename) {
        if (filename.endsWith('.js') && filename != 'basefuncs.js') {
            list.push(filename.substr(0, filename.length - 3))
        }
    });
    fs.writeFileSync('./src/defaults/defaults.json', JSON.stringify(list), 'utf8');
    return;
});


gulp.task('css', ['js'], function () {
    return gulp.src(['./src/css/*.css'], {base: 'src'})
        .pipe(minifyCss())
        .pipe(gulp.dest('dist/'))
});

gulp.task('html', ['css'], function () {
    var fileContent = fs.readFileSync('./src/index.html', 'utf8');
    var start = false;
    var lines = fileContent.split(/\r?\n/);
    lines.forEach((ele, index, arr) => {
        if(ele.includes('del:start')){
            start = true;
            arr[index] = '';
        }else if(ele.includes('del:end')){
            start = false;
            arr[index] = '';
        }else if(start){
            arr[index] = '';
        }
    });
    fs.writeFileSync('dist/index.html', lines.join('\n'), 'utf8');

    return gulp.src(['./dist/index.html'])
        .pipe(minifyHtml({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('clean', function () {
    return gulp.src(['dist']).pipe(clean());
});

gulp.task('default', ['clean'], function () {
    return gulp.start("html");
});