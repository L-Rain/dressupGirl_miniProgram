var gulp = require("gulp");
var babel = require("gulp-babel");
var through = require('through2');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var clean = require('gulp-clean');
var spritesmith = require('gulp.spritesmith');
var buffer = require('vinyl-buffer');
// var csso = require('gulp-csso');
var imagemin = require('gulp-imagemin');
var merge = require('merge-stream');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var compass = require('gulp-compass');

function prefixStream(prefixText) {
    var stream = through();
    stream.write(prefixText);
    return stream;
}

function gulpAddRequireRuntime() {
    // 创建一个让每个文件通过的 stream 通道
    return through.obj(function(file, enc, cb) {
        var prefixText = ``;
        var rel = path.relative(path.dirname(file.path), path.join(file.base, 'lib/runtime.js'));
        rel = rel.replace(/\\/g, '/');
        if (rel === 'runtime.js') {
            prefixText = new Buffer(prefixText); // 预先分配
        } else {
            prefixText = `var regeneratorRuntime = require("${rel}");`;
            prefixText = new Buffer(prefixText); // 预先分配
        }


        if (file.isNull()) {
            // 返回空文件
            cb(null, file);
        }
        if (file.isBuffer()) {
            file.contents = Buffer.concat([prefixText, file.contents]);
        }
        if (file.isStream()) {
            file.contents = file.contents.pipe(prefixStream(prefixText));
        }

        cb(null, file);
    });

}

// 雪碧图排列方式 :top-down、left-right、diagonal、alt-diagonal、binary-tree
let fileNames = [{
    name : 'loading',
    type : 'left-right',
    padding : 0
}];

gulp.task('compile', () => {
    return watch(['./src/**/*.js'], { ignoreInitial: false })
        .pipe(sourcemaps.init())
        .pipe(babel())
        .on('error', (e) => {
            console.log(e);
        })
        .pipe(gulpAddRequireRuntime())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./dist'));
});

gulp.task('scripts', () => {
    return gulp.src(['./src/**/*.js'])
        .pipe(babel())
        .pipe(gulpAddRequireRuntime())
        .pipe(gulp.dest('./dist'));
});

gulp.task('xml', () => {
    return gulp.src('./src/**/*.wxml')
        .pipe(gulp.dest('./dist'));
});

gulp.task('json', () => {
    return gulp.src('./src/**/*.json')
        .pipe(gulp.dest('./dist'));
});

gulp.task('jpg', () => {
    return gulp.src(['src/**/*.jpg','!./src/images/sprites'])
        // .pipe(imagemin())
        .pipe(gulp.dest('./dist'));
});

gulp.task('png', () => {
    return gulp.src(['src/**/*.png','!./src/images'])
        // .pipe(imagemin())
        .pipe(gulp.dest('./dist'));
});

gulp.task('gif', () => {
    return gulp.src(['src/**/*.gif','!./src/images/sprites'])
        // .pipe(imagemin())
        .pipe(gulp.dest('./dist'));
});

gulp.task('compass', function() {
  return gulp.src('./src/**/*.wxss')
    .pipe(compass({
      config_file: './config.rb',
        css: './src',
        sass: './src/**/*.wxss',
        image: './src/images',
    }))
    .on('error', function(err) {

    })
    // .pipe(livereload());
});

gulp.task('sass', () => {
  return gulp.src('./src/**/*.wxss')
    .pipe(sass())
    .pipe(rename((path)=> {
        path.extname = ".wxss";
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('sprite', () => {
    var spriteData = "",
        imgStream,
        cssStream;
    for(let el of fileNames){
        spriteData = gulp.src(`./src/images/sprites/${el.name}/*.png`)
        .pipe(spritesmith({
            imgName: `${el.name}_sprite.png`,
            cssName: `${el.name}_sprite.css`,
            algorithm: `${el.type}`,
            padding : el.padding,
            cssTemplate:(data)=>{
            // data为对象，保存合成前小图和合成打大图的信息包括小图在大图之中的信息
               let arr = [],
                    width = data.spritesheet.width,
                    height = data.spritesheet.height,
                    url =  data.spritesheet.image;
                //data.spritesheet.px 里有对应的px数据
                data.sprites.forEach(function(sprite) {
                    arr.push(
                        ".icon-"+sprite.name+
                        "{"+
                            "background: url('"+url+"') "+
                            "no-repeat "+
                            sprite.offset_x/20/1.8+"rem "+sprite.offset_y/20/1.8+"rem;"+
                            "background-size: "+ width/20/1.8+"rem "+height/20/1.8+"rem;"+
                            "width: "+sprite.width/20/1.8+"rem;"+
                            "height: "+sprite.height/20/1.8+"rem;"+
                        "}\n"
                    )
                })
                return arr.join("")
            }
        }));
        console.log(spriteData);
        imgStream = spriteData.img
            .pipe(buffer())
            .pipe(imagemin())
            .pipe(gulp.dest('./dist/images/'));

        cssStream = spriteData.css
            .pipe(rename(`${el.name}.wxss`))
            .pipe(gulp.dest('./dist/wxss/'));

      return merge(imgStream, cssStream);
    }
});

gulp.task("clean", function() {
    return gulp.src('./dist')
        .pipe(clean());
});

gulp.task('res', ['sass', 'xml', 'json', 'jpg', 'png', 'gif']);

gulp.task('build', ['clean'], function() {
    gulp.start( 'scripts', 'res');
});

gulp.task('watch', function() {
    gulp.watch('./src/**/*.wxss',['sass']);
    gulp.watch('./src/**/*.wxml',['xml']);
    gulp.watch('./src/**/*.json',['json']);
    gulp.watch(['src/**/*.jpg','!./src/images/sprites'],['jpg']);
    gulp.watch(['src/**/*.gif','!./src/images/sprites'],['gif']);
    gulp.watch(['src/**/*.png','!./src/images/sprites'],['png']);
    // gulp.watch('./src/images/sprites/**/*.png',['sprite']);
    gulp.watch('./src/**/*.js',['compile']);
});
