//require('babel/register');
//require('es5-shim');
//require('es6-shim');

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var chalk = require('chalk');
var terminal = require('window-size');

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));
var url = argv.url;
var currentOffset = 0;

repeatCall();

function repeatCall() {
    return getEndpointData(url)
    .then(printEndpointData)
    .then(function() {
        return wait(60)
        .then(repeatCall);
    })
//    .catch(logApplicationError);
}

function logApplicationError(err) {    
    // we've received an application error
    console.log('===============APPLICATION ERROR==================');
    console.log(err);
}

function printEndpointData(data) {
    // print a clean screen of data
//    console.log('\033[2J');
    var frame = {
        requestedOffset : currentOffset,
        buffer : data
    }
    getFrameOfBuffer(frame).then(function(frame) {
        // maintain the calculated offset for the requested offset
        currentOffset = frame.offset;
        console.log(data);
        console.log(Date.now());
        console.log(data.split('\n').length);
        console.log(data.split('\n').slice(4, 9));
    });
}

// takes in { integer : requestedIndex, string : buffer }
// returns { integer : offset, integer : length }
function getFrameOfBuffer(data) {
    var lines = data.buffer.split('\n');
    // our frame must always fit the terminal size
    var minLength = terminal.height;
    var maxLength = terminal.height;
    if (minLength > data.buffer.length) minLength = data.buffer.length;
    var offset = Math.max(0, lines.length - minLength);
    var frame = lines.slice(lines.length, minLength);
    return Promise.resolve({
        offset : offset,
        length : 
    });
}

var lastGoodResponse;
function getEndpointData(url) {
    return getUrl(url).then(function(body) {
        // format our response body
        lastGoodResponse = JSON.stringify(JSON.parse(body), null, 4);
        return lastGoodResponse;
    }).catch(function(err) {
        // if we've not received our own error object type
        if (err.http_code) {
            // display error output
            return chalk.red(lastGoodResponse);
        } else {
             throw err;
        }
    });
}

// request supplied url
function getUrl(url) {
    return request(url).spread(function(response, body) {
        if (response.statusCode !== 200) {
            var error = new Error('Bad response code');
            error.http_code = response.statusCode;
            throw error;
        }
        return body;
    });
}

// make a promise based 'setTimeout'
function wait (ms) {
    var deferred = Promise.pending();
    setTimeout(function(){
        deferred.fulfill();
    }, ms);
    return deferred.promise;
}
