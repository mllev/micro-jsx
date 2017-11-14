function is_space (c) {
  return c === ' ' || c === '\t' || c === '\n'
}

function is_numeric (c) {
  c = c.charCodeAt(0)
  return c >= 48 && c <= 57
}

function is_alpha (c) {
  c = c.charCodeAt(0)
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122)
}

function is_special (c) {
  return c === '-' || c === '_' || c === '$'
}

function is_id_char (c) {
  return is_alpha(c) || is_numeric(c) || is_special(c)
}

var symbols = {
  '<': 'less_than',
  '>': 'greater_than',
  '=': 'equals',
  '{': 'left_brace',
  '}': 'right_brace',
  ')': 'right_paren',
  ']': 'left_paren'
}

function program (js) {
  var tok = undefined
  var i = 0
  var eof = js.length
  var tokens = []
  var skip = 0
  var lineno = 1
  var dat = undefined
  var out = ''

  while (i < eof) {
    switch (js[i]) {
      case '<':
      case '>':
      case '=':
      case '{':
      case '}':
      case ')':
      case ']': {
        tok = {
          type: symbols[js[i]],
          data: js[i++]
        }
      } break
      case '"':
      case '\'':
      case '`': {
        var del = js[i++]
        dat = ''
        while (i < eof) {
          if (js[i] === del && js[i-1] !== '\\')
            break
          if (js[i] === '\n') skip++
          dat += js[i++]
        }
        i++
        tok = { type: 'string', data: del + dat + del }
      } break
      case '/': {
        var n = js[++i]
        dat = ''
        if (n === '/') {
          i++
          while (i < eof) {
            if (js[i] === '\n') {
              skip++
              break
            }
            dat += js[i++]
          }
          tok = { type: 'comment', data: dat }
        } else if (n === '*') {
          i++
          while (i < eof) {
            if (js[i] === '*' && js[i+1] === '/') {
              i += 2
              break
            }
            if (js[i] === '\n') skip++
            dat += js[i++]
          }
          tok = { type: 'comment', data: dat }
        } else {
          tok = { type: 'forward_slash', data: '/' }
        }
      } break
      default: {
        if (is_alpha(js[i]) || is_special(js[i])) {
          dat = ''
          while (i < eof) {
            if (!is_id_char(js[i]))
              break
            dat += js[i++]
          }
          tok = { type: 'name', data: dat }
        } else if (is_space(js[i])) {
          dat = ''
          while (i < eof) {
            if (!is_space(js[i]))
              break
            if (js[i] === '\n') skip++
            dat += js[i++]
          }
          tok = { type: 'space', data: dat }
        } else {
          dat = ''
          while (i < eof) {
            if (is_space(js[i]))
              break
            dat += js[i++]
          }
          tok = { type: 'code', data: dat }
        }
      } break
    }
    tokens.push({
      token: tok,
      line: lineno
    })
    lineno += skip
    skip = 0
  }

  function log (color, text) {
    const colors = {
      dim: '\x1b[2m',
      bgred: '\x1b[41m',
      red: '\x1b[31m',
      default: '\x1b[0m'
    }

    console.log(colors[color], '\b' + text, colors.default)
  }
  
  function printLine (l, c, message) {
    var char = ''
    var start = l + ' | '
    var line = ''
    var i
    var nl

    for (i = 0; i < tokens.length; i++) {
      if (tokens[i].line >= l) {
        if (i > 0) {
          nl = tokens[i-1].token.data.lastIndexOf('\n')
          if (tokens[i-1].line < l && nl !== -1) {
            line += (tokens[i-1].token.data.slice(nl + 1))
          }
        }
        if (tokens[i].line === l) {
          if (tokens[i].token.type !== 'space') {
            line += tokens[i].token.data
          } else {
            if (i < tokens.length - 1 && tokens[i+1].line === l)
              line += tokens[i].token.data
          }
        }
      }
    }

    for (i = 0; i < start.length + c - 1; i++) {
      char += ' '
    }

    log('bgred', message)
    log('dim', start + line)
    log('red', char + '^')
  }

  // begin parsing
  printLine(13, 3, 'Error: unexpected identifier')

  return out
}

module.exports = program