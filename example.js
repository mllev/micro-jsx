var fs = require('fs')
var compile_jsx = require('./index.js')
var file = fs.readFileSync('./test.jsx').toString()

console.log(compile_jsx(file, 'React.createElement'))
