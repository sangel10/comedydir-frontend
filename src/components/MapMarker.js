import React from 'react'
import PropTypes from 'prop-types'

class MapMarker extends React.Component {
  render() {
    return (
      <div className="marker">
        {this.props.isSelected ? <div>{this.props.name} - {this.props.description}</div> : null}
      </div>
    )
  }
}
MapMarker.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string,
  isSelected: PropTypes.bool,
  eventData: PropTypes.object,
}

export default MapMarker
