'use strict';

var ok = require('log-ok');
var dir = require('resolve-dir');
var size = require('./');

size('*/node_modules/**', {cwd: dir('~')}, function(err, stats) {
  ok(stats.size, `(${stats.count} files)`);
  ok(stats.top(3));
  console.log(stats.table(stats.top(25)));
});
