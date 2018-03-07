/**
 * Deployment Script
 */

const config = require('./config.js');
const spawn = require('child_process').spawn;

var argv = [ 'push', '--site', config.dest ];

if (process.argv.includes('--test')) {
  argv.push('--dry-run');
}

spawn('s3_website', argv, { stdio: 'inherit' });
