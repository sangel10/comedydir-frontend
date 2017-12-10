import React from 'react'
import PropTypes from 'prop-types'

class PageControl extends React.Component {

  getPages() {
    const pagesArray = Array.from(Array(this.props.totalPages || 1).keys())
    return pagesArray.map((pageNumber, index)=>{
      const isSelected = this.props.currentPage === index + 1
      return (
        <span
          key={index}
          onClick={()=> this.props.onClick(index+1)}
          className={isSelected ? 'selected' : '' }
        >
          {index + 1}
        </span>
      )
    })
  }
  render() {
    const pages = this.getPages()
    return (
      <div className="page-control">
        Page
        {this.props.currentPage > 1 ?
          <span className="pointer" onClick={() => {this.props.onClick(this.props.currentPage - 1)}}> Prev</span> : null}
        {pages}
        {this.props.hasNextPage ?
          <span className="pointer" onClick={() => {this.props.onClick(this.props.currentPage + 1)}}> Next</span> : null}
      </div>
    )
  }
}
export default PageControl

PageControl.propTypes = {
  totalPages: PropTypes.number,
  currentPage: PropTypes.number,
  hasNextPage: PropTypes.bool,
  onClick: PropTypes.func
}
