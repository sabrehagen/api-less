## Synopsis

A utility that implements similar functionality to the unix less utility for observing API endpoints during debugging.

**WARNING**

This tool can be very load intensive on your server. It will query your server every 40ms by default to keep the data up to date. If your maximum request time is larger than 40ms, you can change the interval by suppying `--interval ms` on the command line.

## Installation

`npm install --save api-less`

## Usage

Your API endpoint is best paired with [nodemon](https://github.com/remy/nodemon) so that your server will automatically restart when you save your changes.

Supply a URL to observe and let the utility do its magic:

`$ api-less --url http://localhost:3000/api/v1/users/jacksondelahunt`

The program is interactive (much like less is) in that you can use single keys to perform actions.

`Arrow Up/Down` - Scroll up or down the buffer one line at a time.

`Page Up/Down` - Scroll up or down the buffer one page at a time.

`n` - Toggle line numbers on or off.

`q` - Exit the program.

## Options

`--url string` - The fully qualified URL of your endpoint to query.

`--interval integer` - The number of milliseconds before requerying the URL.

`--lines boolean` - Display line numbers in output.

## Motivation

When building APIs you want to see the object you're exposing. Each time you make a change to your code, you need to query the API again to get the latest version. If you're working with a large object, and the part you're interested in is past the bottom of the screen, you have to scroll each time. This is obviously painful.

Instead, use this tool to observe your API endpoint's output as you change your code, all whilst maintaining your position in the output.

## License

MIT