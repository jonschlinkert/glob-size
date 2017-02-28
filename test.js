'use strict';

require('mocha');
var assert = require('assert');
var size = require('./');

describe('glob-size', function() {
  it('should export a function', function() {
    assert.equal(typeof size, 'function');
  });

  it('should glob files from the cwd', function(cb) {
    size('*', function(err, stats) {
      assert(stats.count > 1);
      cb();
    });
  });

  it('should get the top n records by size', function(cb) {
    size('*', function(err, stats) {
      assert.equal(stats.top(3).length, 3);
      assert.equal(stats.top(5).length, 5);
      assert.equal(stats.top(1).length, 1);
      cb();
    });
  });

  it('should create a table with n records', function(cb) {
    size('*', function(err, stats) {
      assert.equal(stats.table(stats.top(1)).split('\n').length, 2);
      assert.equal(stats.table(stats.top(2)).split('\n').length, 3);
      assert.equal(stats.table(stats.top(3)).split('\n').length, 4);
      assert.equal(stats.table(stats.top(4)).split('\n').length, 5);
      cb();
    });
  });
});
