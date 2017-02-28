#!/usr/bin/env node

var ok = require('log-ok');
var util = require('util');
var size = require('..');
var argv = require('yargs')(process.argv.slice(2))
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
  .option('stats', {
    alias: 's',
    describe: 'log out the entire stats object with all files',
  })
  .help()
  .argv;

var pattern = argv.pattern || (argv._.length ? argv._ : null) || '*';

size(pattern, argv, function(err, stats) {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  if (argv.stats) {
    console.log(util.inspect(stats, {maxArrayLength: null}));
  } else if (argv.table) {
    console.log(stats.table(stats.top(argv.table)));
  } else {
    ok(stats.size, `(${stats.count} files)`);
  }

  process.exit();
});
