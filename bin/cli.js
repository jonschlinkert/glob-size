#!/usr/bin/env node

const size = require('..');
const path = require('path');
const ok = require('log-ok');
const util = require('util');
const assert = require('assert');
const find = require('find-file-up');
const pkgPath = find.sync('package.json');
const pkg = require(pkgPath);
const cwd = path.join.bind(path, path.dirname(pkgPath));

const argv = require('yargs')(process.argv.slice(2))
  .option('cwd', {
    alias: 'd',
    describe: 'directory to search from',
    default: '.'
  })
  .option('pattern', {
    alias: 'p',
    describe: 'one or more glob patterns, comma-separated'
  })
  .option('table', {
    alias: 't',
    describe: 'Show a text table of files sorted by size'
  })
  .option('files', {
    alias: 'f',
    describe: 'Show a text table of package.json files sorted by size'
  })
  .option('stats', {
    alias: 's',
    describe: 'log out the entire stats object with all files'
  })
  .help()
  .argv;

let pattern = argv.pattern || (argv._.length ? argv._ : null) || '*';

if (argv.files) {
  assert(Array.isArray(pkg.files), 'expected package.json files to be an array');
  pattern = pkg.files;
  pattern.push(cwd('package.json'));
  pattern.push(cwd('license'));
  pattern.push(cwd('readme.md'));
  pattern = pattern.filter((p, i) => pattern.indexOf(p) === i);
}

size(pattern, argv)
  .then(stats => {
    if (argv.stats) {
      console.log(util.inspect(stats, { maxArrayLength: null }));
    } else if (argv.files || argv.table) {
      console.log(stats.table(stats.top(argv.table)));
    } else {
      ok(stats.size, `(${stats.count} files)`);
    }
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
