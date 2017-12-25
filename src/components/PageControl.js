import React from 'react'
import PropTypes from 'prop-types'

class PageControl extends React.Component {

  render() {
    return (
      <div className="page-control">
        {this.props.hasPreviousPage ?
          <button className="pointer prev" onClick={() => {this.props.onClick(-1)}}> Prev</button> : null}
        {this.props.hasNextPage ?
          <button className="pointer next" onClick={() => {this.props.onClick(1)}}> Next</button> : null}
      </div>
    )
  }
}
export default PageControl

PageControl.propTypes = {
  currentPage: PropTypes.number,
  hasNextPage: PropTypes.bool,
  onClick: PropTypes.func,
}
