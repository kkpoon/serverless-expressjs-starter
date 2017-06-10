/*
 * Copyright 2017 kkpoon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var gulp = require("gulp");
var zip = require("gulp-zip");
var del = require("del");
var runSequence = require("run-sequence");
var install = require("gulp-install");
var lambda = require("gulp-awslambda");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task("clean", function() {
    return del(["./dist", "./dist.zip"]);
});

gulp.task("ts", function() {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest("dist"));
});

gulp.task("node-mods", function() {
    return gulp
        .src("./package.json")
        .pipe(gulp.dest("dist/"))
        .pipe(install({ production: true }));
});

gulp.task("zip", function() {
    return gulp
        .src(["dist/**/*", "!dist/package.json"])
        .pipe(zip("dist.zip"))
        .pipe(gulp.dest("."));
});

gulp.task("upload", function() {
    return gulp
        .src("dist.zip")
        .pipe(
            lambda(
                {
                    Description: "<YOUR_LAMBDA_DESCRIPTION>",
                    FunctionName: "<YOUR_LAMBDA_FUNCTION_NAME>",
                    Handler: "lambda.handler",
                    Role: "<YOUR_LAMBDA_IAM_ROLE>",
                    Timeout: 5,
                    MemorySize: 128,
                    Runtime: "nodejs6.10",
                    Environment: {
                        Variables: {
                            YOUR_ENVIRONMENT_VARIABLE:
                                process.env.YOUR_ENVIRONMENT_VARIABLE
                        }
                    }
                },
                {
                    publish: true,
                    region: "us-east-1"
                }
            )
        )
        .pipe(gulp.dest("."));
});

gulp.task("deploy:lambda", function(callback) {
    return runSequence(
        ["clean"],
        ["ts", "node-mods"],
        ["zip"],
        ["upload"],
        callback
    );
});
