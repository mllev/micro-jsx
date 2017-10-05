# micro-jsx
A tiny jsx compiler.

## what
This is a tiny, single-pass compiler for jsx. It takes in a string of javascript and spits out a string of javascript. That's all. It's not super fast yet, but that is one of my goals. It can be used in browser (as `window.CompileJSX`), or from node.js. I included a BNF-ish grammar that I used to write the parser.

## why
Because I no longer use babel for anything other than jsx compilation.

## usage
```javascript
var fs = require('fs')
var compile_jsx = require('micro-jsx')
var file = fs.readFileSync('./test.jsx').toString()

console.log(compile_jsx(file, 'React.createElement'))
```

## limitations
Inner html text is trimmed.`<div> inner text </div>`will be rendered as `React.createElement('div', null, 'inner text')`. If you want additional spaces, use `&nbsp;`.

`&nbsp;` is actually the only special html character you can use. For the other ones (like `&copy;`, etc.), you must use unicode characters. Babel does this transformation automatically.

It does not support the spread operator for passing props to components.

## issues
The error reporting isn't very good right now.
