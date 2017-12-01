let React = require('react')

class Component extends React.Component {
  constructor (props) {
    super(props)
  }

  render () {
    return <div class="hello">
      from
      <span id="value">JSX</span>
      <MyComponent required />
    </div>
  }
}

module.exports = Component