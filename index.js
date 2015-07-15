require('es5-shim');
require('es6-shim');
var util = require('util');

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

// early exit if they haven't supplied a url; this is the only thing we need
if (!argv.url) return console.log('No url supplied! Use --url to supply the fully qualified url you want to monitor.');

// default options
var options = {
    url : '',
    interval : 40,
    lineNumbers : false
}

// extend default options with supplied command line arguments
util._extend(options, argv);

// initiate the main program
module.exports = require('./lib/api-less')(options);