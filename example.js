'use strict';

var ok = require('log-ok');
var dir = require('resolve-dir');
var size = require('./');

size('*/node_modules/**', {cwd: dir('~')}, function(err, stats) {
  ok(stats.size, `(${stats.count} files)`);
  ok(stats.top(3));
  console.log(stats.table(stats.top(25)));
});

// get the size of all files in the cwd
size('*', function(err, stats) {
  console.log(stats);
});

// get the size of all `.js` files in the cwd
size('*.js', function(err, stats) {
  console.log(stats);
});

// get the size of all `.js` files in "./foo"
size('*.js', {cwd: 'foo'}, function(err, stats) {
  console.log(stats);
});

// show the 25 largest files in "node_modules/**"
size('node_modules/**', function(err, stats) {
  console.log(stats.top(25));
});

// show the 3 largest files in "node_modules/**"
size('node_modules/**', function(err, stats) {
  console.log(stats.top(3));
});

// show the 3 largest files in "node_modules/**"
size('node_modules/**', function(err, stats) {
  console.log(stats.top(3));
});

// tableize the 3 largest files in "node_modules/**"
size('node_modules/**', function(err, stats) {
  console.log(stats.table(stats.top(50)));
});

// tableize all files
size('node_modules/**', function(err, stats) {
  console.log(stats.table(stats.files));
});

var stats = size.sync('*');
console.log(stats.table(stats.top(3)));
