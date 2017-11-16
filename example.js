var fs = require('fs')
var compile_jsx = require('./v2.js')
var file = fs.readFileSync('./test.jsx').toString()

compile_jsx(file, 'React.createElement')
