require('es5-shim');
require('es6-shim');

var util = require('util');
var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var chalk = require('chalk');
var terminal = require('window-size');
var moment = require('moment');

// parse command line arguments
var argv = require('minimist')(process.argv.slice(2));

// early exit if they haven't supplied a url; this is the only thing we need
if (!argv.url) return console.log('No url supplied! Use --url to supply the fully qualified url you want to monitor.');

// default options
var options = {
    url : '',
    interval : 40,
    lineNumbers : true
}

// extend default options with supplied command line arguments
util._extend(options, argv);

var currentOffset = 0;
var lastBuffer;
var lastFrame = {};

// save the last response for the status bar
var lastResponse = {
    httpStatus : undefined,
    timestamp : undefined,
    rtt : undefined
}

// start calling the api on repeat - this is the main funcion of the program
repeatCall();

// monitor the command line for input
readInput();

/* --------------------------------------------------- */
/* All helper functions below this point               */
/* --------------------------------------------------- */

function repeatCall() {
    return getEndpointData(options.url).then(function(data) {
        // save a copy of the server response
        lastBuffer = data;

        // get a frame of the buffer at a given offset
        var frame = getFrameOfBuffer({ requestedOffset : currentOffset, buffer : data });

        // maintain the calculated offset. ensures we can't go past the end of the frame buffer
        currentOffset = frame.offset;

        // output the requested frame of the buffer
        printFrame(frame)

        // wait for the desired number of ms then refresh
        return wait(options.interval).then(repeatCall);
    })
    .catch(logApplicationError);
}

function logApplicationError(err) {    
    // we've received an application error
    console.log('===============APPLICATION ERROR==================');
    console.log(err);
}

function printFrame(frame) {
    // the string we will print
    var output;

    if (options.lineNumbers) {
        var lineNumber;
        // calculate the number of characters in the largest line number
        var padding = (frame.length + frame.offset).toString().length;

        // prefix line numbers
        output = frame.data.split('\n');
        for (var i = 0; i < frame.length; i++) {
            // format the line number and pad it to the maximum possible line number length for the frame
            lineNumber = (frame.offset + i);
            lineNumber = lineNumber.toString().length < padding ? lineNumber + new Array(padding - lineNumber.toString().length).join(' ') : lineNumber;

            // prepend the line number to the output
            output[i] = lineNumber + ' ' + output[i];
        }
        output = output.join('\n');
    } else {
        output = frame.data;
    }

    var statusLine;
    if (lastResponse.httpStatus === 'XXX') {
        statusLine = chalk.red(statusBar());
    } else {
        statusLine = chalk.white(statusBar());
    }

    // clear the console and print the frame
    process.stdout.write(['\033[2J', statusLine, output, ':'].join('\n'));
}

// takes in { integer : requestedOffset, string : buffer }
// returns { integer : offset, integer : length, string : data }
function getFrameOfBuffer(data) {
    var lines = data.buffer.split('\n');
    var frameStart, frameEnd, frame;

    // if the buffer size is less than the terminal size, return the full buffer
    if (lines.length < terminalHeight()) {
        frameStart = 0;
        frameEnd = lines.length;
        frame = data.buffer;
    } else 

    // if the requested offset would result in a buffer less than the terminal size,
    // that is, the frame would pass the end of the buffer, return a terminal sized slice
    // of the buffer positioned at the end of the buffer
    if (data.requestedOffset + terminalHeight() > lines.length) {
        frameStart = lines.length - terminalHeight();
        frameEnd = terminalHeight();
        frame = lines.slice(frameStart, frameStart + frameEnd).join('\n');
    } else

    // we have a range within the bounds of the buffer and can return the requested size
    {
        // we have a frame that falls within the buffer, so pull out the frame
        frameStart = data.requestedOffset;
        frameEnd = terminalHeight();
        frame = lines.slice(frameStart, frameStart + frameEnd).join('\n');
    }

    return {
        offset : frameStart,
        length : frameEnd,
        data : frame
    };
}

var lastGoodResponse;
function getEndpointData(url) {
    return getUrl(url).then(function(body) {
        // format our response body
        lastGoodResponse = JSON.stringify(JSON.parse(body), null, 4);
        return chalk.white(lastGoodResponse);
    }).catch(function(err) {
        if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
            // server is restarting
            lastResponse.httpStatus = 'XXX';
            lastResponse.timestamp = Date.now();
            lastResponse.rtt = '0';
            //grey out output to show waiting
            return chalk.grey(lastGoodResponse);
        } else {
             throw err;
        }
    });
}

// request supplied url
function getUrl(url) {
    var requestStart = Date.now();
    return request(url).spread(function(response, body) {
        lastResponse.httpStatus = response.statusCode;
        lastResponse.timestamp = Date.now();
        lastResponse.rtt = Date.now() - requestStart;
        return body;
    });
}

// make a promise based 'setTimeout'
function wait(ms) {
    var deferred = Promise.pending();
    setTimeout(function(){
        deferred.fulfill();
    }, ms);
    return deferred.promise;
}

function readInput() {
    var stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(key) {
//        console.log('key:', toUnicode(key), '\n');

        // up
        if (key === '\u001B\u005B\u0041') {
            if (currentOffset > 0) currentOffset--;
        }

        // down
        if (key === '\u001B\u005B\u0042') {
            currentOffset++;
        }

        // page up
        if (key === '\u001B\u005B\u0035\u007E') {
            // keep our offset >= 0
            currentOffset = Math.max(currentOffset - terminalHeight(), 0);
        }

        // page down
        if (key === '\u001B\u005B\u0036\u007E') {
            currentOffset += terminalHeight();
        }

        // n
        if (key === '\u006E') {
            options.lineNumbers = !options.lineNumbers;
        }

        // ctrl-c or q
        if (key === '\u0003' || key === '\u0071') process.exit();
    });
}

function statusBar() {
    var timestamp = new Date(lastResponse.timestamp);
    var statusText = util.format('HTTP: %s | RTT: %sms | Timestamp: %s', lastResponse.httpStatus, lastResponse.rtt, moment(timestamp).format('hh:mm:ss a'));
    var statusLine = new Array(terminal.width() - statusText.length).join(' ') + statusText;

    return statusLine;
}

// function kept for finding out unicode version of input character
function toUnicode(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}

function terminalHeight() {
    // when we print status/output lines at the end of the output, the 
    // previous output is pushed up, so lines are lost off the top of the
    // screen. thus, wrap the call to terminal height and subtract the
    // number of lines we use for status to get the 'available' terminal height
    var statusLines = 2;
    return terminal.height() - statusLines;
}