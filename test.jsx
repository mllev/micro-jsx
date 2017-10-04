let React = require('react')

class Component extends React.Component {
  constructor (props) {
    super(props)
  }

  render () {
    return <div class="hello">from<b>JSX</b></div>
  }
}

module.exports = Component
