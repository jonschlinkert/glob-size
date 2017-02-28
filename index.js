'use strict';

var fs = require('fs');
var path = require('path');
var glob = require('matched');
var isAbsolute = require('is-absolute');
var extend = require('extend-shallow');
var text = require('text-table');
var dir = require('resolve-dir');

/**
 * Get the size of all files that match the given glob `patterns`.
 *
 * ```js
 * // get the size of all files in the cwd
 * size('*', function(err, stats) {
 *   console.log(stats);
 * });
 * ```
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @param {Function} `cb`
 * @return {Object}
 * @api public
 */

module.exports = function(patterns, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  var opts = extend({cwd: process.cwd(), nocase: true}, options);

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
    cb(null, toStats(files, opts));
  });
};

/**
 * Synchronously get the size of all files that match the given glob `patterns`.
 *
 * ```js
 * // get the size of all files in the cwd
 * var stats = size.sync('*');
 * console.log(stats);
 * ```
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

module.exports.sync = function(patterns, options) {
  var opts = extend({cwd: process.cwd(), nocase: true}, options);
  var files = glob.sync(patterns, opts);
  return toStats(files, opts);
};

/**
 * Returns the top `n` files by size, sorted in ascending order.
 * _(this method is exposed on the returned stats object)_
 *
 * ```js
 * size('node_modules/**', function(err, stats) {
 *   console.log(stats.top(25));
 * });
 * ```
 * @name .stats.top
 * @param {Number} `n` The number of files to return.
 * @return {Array} Array of the top `n` files
 * @api public
 */

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

/**
 * Create a text table from the `stats.files` array returned
 * by the main export, or from the [.top](#top) method. _(this
 * method is exposed on the returned stats object)_
 *
 * ```js
 * // tableize the 3 largest files in "node_modules/**"
 * size('node_modules/**', function(err, stats) {
 *   console.log(stats.table(stats.top(50)));
 * });
 *
 * // tableize all files
 * size('node_modules/**', function(err, stats) {
 *   console.log(stats.table(stats.files));
 * });
 * ```
 * @name .stats.tableize
 * @param {Array} `files`
 * @return {String}
 * @api public
 */

function tableize(files, cwd) {
  if (!Array.isArray(files)) {
    throw new TypeError('expected an array of objects');
  }

  var table = [];
  var total = {bytes: 0, files: files.length};

  for (var i = 0; i < total.files; i++) {
    var stat = files[i];
    table.push([stat.size, path.relative(cwd, stat.file)]);
    total.bytes += stat.bytes;
  }

  table.push([format(total.bytes), `(${total.files} files)`]);
  return text(table, {align: ['r', 'l']});
}

/**
 * Create the stats arrays
 */

function toStats(files, options) {
  var stats = {files: [], total: 0, count: 0};
  for (var i = 0; i < files.length; i++) {
    var file = files[i];

    if (!isAbsolute(file)) {
      file = path.join(options.cwd, file);
    }

    var stat = fs.statSync(file);
    stats.files.push({file: file, size: format(stat.size), bytes: stat.size});
    stats.total += stat.size;
    stats.count++;
  }

  stats.size = format(stats.total);
  stats.top = top(stats);
  stats.table = function(val) {
    return tableize(val, options.cwd);
  };
  return stats;
}

/**
 * Format sizes
 */

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
