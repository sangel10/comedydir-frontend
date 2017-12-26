import React from 'react'
import PropTypes from 'prop-types'
import PlainEventItem from './PlainEventItem'

class PlainEventList extends React.Component {

  renderEvents() {
    return this.props.events.map((event) => {
      return <PlainEventItem key={event.pk} event={event} isExpanded={false}/>
    })
  }


  render() {
    const events = this.renderEvents()
    return (
      <div>
        {this.props.events.length ? events: <span>No events found, try another search or <a href="//www.facebook.com/groups/1814445198866527/">add an event</a></span> }
      </div>
    )
  }
}

export default PlainEventList

PlainEventList.propTypes = {
  events: PropTypes.array.isRequired,
  // totalPages: PropTypes.number,
  // limit: PropTypes.number,
  // currentPage: PropTypes.number,
  // hasNextPage: PropTypes.bool.isRequired,
  // onPageControlClick: PropTypes.func.isRequired,
}
