'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const glob = require('matched');
const text = require('text-table');
const dir = require('resolve-dir');
const stats = util.promisify(fs.stat);

/**
 * Get the size of all files that match the given glob `patterns`.
 *
 * ```js
 * // get the size of all files in the cwd
 * size('*')
 *   .then(console.log)
 *   .catch(console.error)
 * ```
 * @param {string|array} `patterns`
 * @param {object} `options`
 * @return {promise}
 * @api public
 */

module.exports = async(patterns, options) => {
  const opts = Object.assign({ cwd: process.cwd(), nocase: true }, options);

  if (typeof patterns === 'string') {
    patterns = patterns.split(',');
  }

  patterns = patterns.map(function(pattern) {
    return path.resolve(opts.cwd, dir(pattern));
  });

  return toStats(await lookup(patterns, opts), opts);
};

async function lookup(patterns, options = {}) {
  const list = await glob(patterns, options);
  const res = [];

  async function recurse(files) {
    for (const fp of files) {
      if (/\.DS_Store|Thumbs\.db$/i.test(fp)) {
        continue;
      }

      const stat = await stats(fp);
      if (stat.isDirectory()) {
        if (!shouldRecurse(patterns, fp, options)) {
          continue;
        }

        const dirFiles = fs.readdirSync(fp).map(name => {
          return path.join(fp, name);
        });

        await recurse(dirFiles);
      } else {
        res.push(fp);
      }
    }
  }

  await recurse(list);
  return res;
}

function shouldRecurse(patterns, dirname, options) {
  const hasPattern = [].concat(patterns).some(p => /node_modules$/.test(p));
  if (/node_modules$/.test(dirname)) {
    if (options.node_modules !== true && !hasPattern) return false;
  }
  return true;
}

/**
 * Synchronously get the size of all files that match the given glob `patterns`.
 *
 * ```js
 * // get the size of all files in the cwd
 * const stats = size.sync('*');
 * console.log(stats);
 * ```
 * @param {String|Array} `patterns`
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

module.exports.sync = function(patterns, options) {
  const opts = Object.assign({cwd: process.cwd(), nocase: true}, options);
  const files = glob.sync(patterns, opts);
  return toStats(files, opts);
};

/**
 * Returns the top `n` files by size, sorted in ascending order.
 * _(this method is exposed on the returned stats object)_
 *
 * ```js
 * size('node_modules/**')
 *   .then(stats => console.log(stats.top(25)))
 *   .catch(console.error);
 * ```
 * @name .stats.top
 * @param {Number} `n` The number of files to return.
 * @return {Array} Array of the top `n` files
 * @api public
 */

function top(stats) {
  return function(n) {
    const files = stats.files.slice();

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
 * size('node_modules/**')
 *   .then(stats => console.log(stats.table(stats.top(3))))
 *   .catch(console.error);
 *
 * // tableize all files
 * size('node_modules/**')
 *   .then(stats => console.log(stats.table(stats.files)))
 *   .catch(console.error);
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

  const total = { bytes: 0, files: files.length };
  const table = [];

  for (let i = 0; i < total.files; i++) {
    const stat = files[i];
    table.push([stat.size, path.relative(cwd, stat.file)]);
    total.bytes += stat.bytes;
  }

  table.push([format(total.bytes), `TOTAL (${total.files} files)`]);
  return text(table, {align: ['r', 'l']});
}

/**
 * Create the stats arrays
 */

function toStats(files, options = {}) {
  const stats = { files: [], total: 0, count: 0 };
  for (let i = 0; i < files.length; i++) {
    let file = files[i];

    if (!path.isAbsolute(file)) {
      file = path.join(options.cwd, file);
    }

    const stat = fs.statSync(file);
    stats.files.push({ file, size: format(stat.size), bytes: stat.size });
    stats.total += stat.size;
    stats.count++;
  }

  stats.table = val => tableize(val, options.cwd);
  stats.size = format(stats.total);
  stats.top = top(stats);
  return stats;
}

/**
 * Format sizes
 */

function format(number, precision) {
  if (typeof precision !== 'number') {
    precision = 2;
  }

  const abbr = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  precision = Math.pow(10, precision);
  number = Number(number);

  let len = abbr.length - 1;
  while (len-- >= 0) {
    const size = Math.pow(10, len * 3);
    if (size <= (number + 1)) {
      number = Math.round(number * precision / size) / precision;
      number += ' ' + abbr[len];
      break;
    }
  }
  return number;
}
