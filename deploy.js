/**
 * Deployment Script
 */

const config = require('./config.js');
const spawn = require('child_process').spawn;

spawn('s3_website', [
  'push',
  '--site', config.dest,
  (process.argv.includes('--test') ? '--dry-run' : '')
  ], { stdio: 'inherit' }
);
