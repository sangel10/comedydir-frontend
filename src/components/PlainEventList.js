import React from 'react'
import PropTypes from 'prop-types'
import PlainEventItem from './PlainEventItem'

class PlainEventList extends React.Component {


  render() {
    return (
      <div>
        {
          this.props.events.map((event) => {
            return <PlainEventItem key={event.pk} event={event} isExpanded={false}/>
          })
        }
      </div>
    )
  }
}

export default PlainEventList

PlainEventList.propTypes = {
  events: PropTypes.array.isRequired,
}
