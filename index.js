'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('matched');
var gray = require('ansi-gray');
var cyan = require('ansi-cyan');
var dir = require('resolve-dir');
var isAbsolute = require('is-absolute');
var extend = require('extend-shallow');
var text = require('text-table');

module.exports = function(patterns, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = extend({cwd: process.cwd(), nocase: true}, options);
  var stats = {files: [], total: 0, count: 0};

  if (typeof patterns === 'string') {
    patterns = patterns.split(',');
  }

  patterns = patterns.map(function(pattern) {
    return path.resolve(opts.cwd, dir(pattern));
  });

  glob(patterns, opts, function(err, files) {
    if (err) {
      cb(err);
      return;
    }

    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (!isAbsolute(file)) {
        file = path.join(opts.cwd, file);
      }

      var stat = fs.statSync(file);
      stats.files.push({file: file, size: format(stat.size), bytes: stat.size});
      stats.total += stat.size;
      stats.count++;
    }

    stats.size = format(stats.total);
    stats.top = top(stats);
    stats.table = function(val) {
      return tableize(val, opts.cwd);
    };

    cb(null, stats);
  });
};

module.exports.sync = function(patterns, options) {
  var opts = extend({cwd: process.cwd(), nocase: true}, options);
  var files = glob.sync(patterns, opts);
  var stats = {files: [], total: 0, count: 0};

  for (var i = 0; i < files.length; i++) {
    var name = files[i];
    var file = path.join(opts.cwd, name);
    var stat = fs.statSync(file);

    stats.files.push({file: file, size: format(stat.size), bytes: stat.size});
    stats.total += stat.size;
    stats.count++;
  }

  stats.size = format(stats.total);
  stats.top = top(stats);
  stats.table = function(val) {
    return tableize(val);
  };

  return stats;
};

function format(number, precision) {
  if (typeof precision !== 'number') {
    precision = 2;
  }

  var abbr = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  precision = Math.pow(10, precision);
  number = Number(number);

  var len = abbr.length - 1;
  while (len-- >= 0) {
    var size = Math.pow(10, len * 3);
    if (size <= (number + 1)) {
      number = Math.round(number * precision / size) / precision;
      number += ' ' + abbr[len];
      break;
    }
  }

  return number;
}

function top(stats) {
  return function(n) {
    var files = stats.files.slice();

    files.sort(function(a, b) {
      return a.bytes < b.bytes ? 1 : (a.bytes > b.bytes ? -1 : 0);
    });

    if (typeof n !== 'number') {
      return files;
    }
    return files.slice(0, n || 10);
  };
}

function tableize(arr, cwd) {
  if (!Array.isArray(arr)) {
    throw new TypeError('expected an array of objects');
  }

  var table = [];
  var total = {bytes: 0, files: 0};

  for (var i = 0; i < arr.length; i++) {
    var stat = arr[i];
    table.push([stat.size, path.relative(cwd, stat.file)]);
    total.bytes += stat.bytes;
    total.files++;
  }

  table.push([format(total.bytes), `(${total.files} files)`]);
  return text(table, {align: ['r', 'l']});
}
