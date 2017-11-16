/*
 * A tiny JSX compiler
 * Author: Matthew Levenstein
 * License: MIT
 */

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

function is_string (c) {
  return c === '"' || c === '\'' || c === '`'
}

function is_sym (c) {
  return ['<','>','=','{','}',')'].indexOf(c) !== -1
}

function compiler (js) {
  var tok = undefined
  var i = 0
  var eof = js.length
  var tokens = []
  var skip = 0
  var lineno = 1
  var dat = undefined
  var out = ''
  var current = 0
  var error = false

  while (i < eof) {
    if (is_sym(js[i])) {
      tok = { type: js[i], data: js[i++] }
    } else if (is_string(js[i])) {
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
    } else if (js[i] === '/') {
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
        tok = { type: '/', data: '/' }
      }
    } else {
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
          if (is_space(js[i]) || is_sym(js[i]) || is_string(js[i]))
            break
          dat += js[i++]
        }
        tok = { type: 'code', data: dat }
      }
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
  
  function printLine (l, caret, message) {
    var char = ''
    var start = l + ' | '
    var line = ''
    var i
    var nl
    var c = 0

    for (i = 0; i < tokens.length; i++) {
      if (i === caret) c = line.length
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

    for (i = 0; i < start.length + c; i++) {
      char += ' '
    }

    log('bgred', message)
    log('dim', start + line)
    log('red', char + '^')
  }

  function next () {
    // @todo: handle writing to the output
    if (current < tokens.length - 1) current++
    if (current < tokens.length - 1 && tokens[current].token.type === 'space')
      current++
  }

  function peek (type, num) {
    if (tokens[current + (num || 0)].token.type === type) {
      return true
    }
    return false
  }

  function accept (type) {
    if (error) return
    if (tokens[current].token.type === type) {
      next()
      return true
    }
    return false
  }

  function expect (type) {
    if (error) return
    var t = tokens[current]
    if (t.token.type === type) {
      next()
    } else {
      error = true
      printLine(t.line, current, 'Error: unexpected ' + t.token.data)
    }
  }

  function is_tag () {
    var p = undefined
    var matched = false

    if (current === 0) {
      matched = false
    } else {
      p = tokens[current - 1]
      if (p.token.type === 'space') {
        if (current >= 2) p = tokens[current - 2]
        else matched = false
      }
    }

    if (peek('<')) {
      if (
         matched === true ||
        (p.token.type !== 'name' || p.token.data === 'return') &&
         p.token.type !== ')' &&
         p.token.type !== '}'
      ) {
        return true
      }
    }
  }

  function parse_jsexpr () {
    if (error) return
    expect('{')
    parse_body(true)
    expect('}')
  }

  function parse_params () {
    if (error) return
    if (accept('name')) {
      if (accept('=')) {
        if (accept('string')) {
          parse_params()
        } else {
          parse_jsexpr()
          parse_params()
        }
      } else {
        parse_params()
      }
    }
  }

  function parse_inner () {
    if (error) return
    if (accept('string')) {
      parse_inner()
    } else if (peek('{')) {
      parse_jsexpr()
      parse_inner()
    } else if (peek('<')) {
      if (peek('/', 1)) {
        return
      } else {
        parse_tag()
        parse_inner()
      }
    } else {
      var inner = ''
      if (current > 0 && tokens[current - 1].token.type === 'space') {
        current--
      }
      while (!peek('{') && !peek('string') && !peek('<')) {
        if (current >= tokens.length - 1) return
        inner += tokens[current++].token.data
      }
      console.log('inner:', inner)
      parse_inner()
    }
  }

  function parse_closing (name) {
    if (error) return
    if (accept('/')) {
      expect('>')
    } else {
      expect('>')
      parse_inner()
      expect('<')
      expect('/')
      expect('name')
      if (tokens[current - 1].token.data === name) {
        console.log('closing tag:', name)
      }
      expect('>')
    }
  }

  function parse_tag () {
    if (error) return
    expect('<')
    expect('name')
    var name = ''
    if (tokens[current - 1].token.type === 'space') name = tokens[current - 2].token.data
    else name = tokens[current - 1].token.data
    console.log('opening tag:', name)
    parse_params()
    parse_closing(name)
  }

  function parse_body (jsexpr) {
    if (error) return
    var c = -1
    while (current < tokens.length - 1) {
      if (error) return

      if (jsexpr) {
        if (peek('{')) c--
        if (peek('}')) c++
        if (c === 0) return
      }

      if (is_tag()) {
        parse_tag()
      } else {
        next()
      }
    }
  }

  parse_body()

  if (error) return js
  else return out
}

module.exports = compiler