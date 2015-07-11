## Synopsis

A utility that implements similar functionality to the unix less utility for observing API endpoints during debugging.

## Installation

npm install --save api-less

## Code Example

Supply a url to observe and let the utility do it's magic:

`api-less --url http://localhost:3000/api/v1/users/jacksondelahunt`

## Motivation

When building APIs you want to see the object you're exposing. Each time you make a change to your code, you need to query the API again to get the latest version. If you're working with a large object, and the part you're interested in is past the bottom of the screen, you have to scroll each time. This is obviously painful.

Instead, use this tool to observe your API endpoint's output as you change your code, all whilst maintaining your position in the output.

## License

MIT