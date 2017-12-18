import React from 'react'
import PropTypes from 'prop-types'

class LoadingSpinner extends React.Component {
  render() {
    return (
      <div className="loading-container">
        <div className="loading-message">{this.props.message}</div>
        <i className="fa fa-spinner fa-spin fa-3x fa-fw"></i>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }
}

export default LoadingSpinner

LoadingSpinner.propTypes = {
  message: PropTypes.string
}
