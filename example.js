var fs = require('fs')
var _compile = require('./index.js')
console.log(_compile(fs.readFileSync('./test.jsx').toString(), 'React.createElement'))