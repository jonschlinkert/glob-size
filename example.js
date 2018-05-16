'use strict';

const ok = require('log-ok');
const dir = require('resolve-dir');
const size = require('./');

let stats = size.sync('*');
console.log(stats.table(stats.top(3)));

(async function() {
  stats = await size('*/node_modules/**', {cwd: dir('~')});
  ok(stats.size, `(${stats.count} files)`);
  ok(stats.top(3));
  console.log(stats.table(stats.top(25)));

  // get the size of all files in the cwd
  stats = await size('*');
  console.log(stats);

  // get the size of all `.js` files in the cwd
  stats = await size('*.js');
  console.log(stats);

  // get the size of all `.js` files in "./bin"
  stats = await size('*.js', { cwd: 'bin' });
  console.log(stats);

  // show the 25 largest files in "node_modules/**"
  stats = await size('node_modules/**');
  console.log(stats.top(25));

  // show the 3 largest files in "node_modules/**"
  stats = await size('node_modules/**');
  console.log(stats.top(3));

  // show the 3 largest files in "node_modules/**"
  stats = await size('node_modules/**');
  console.log(stats.top(3));

  // tableize the 3 largest files in "node_modules/**"
  stats = await size('node_modules/**');
  console.log(stats.table(stats.top(50)));

  // tableize all files
  stats = await size('node_modules/**');
  console.log(stats.table(stats.files));
})();
