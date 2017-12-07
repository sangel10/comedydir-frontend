import React from 'react'
import moment from 'moment'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

class EventList extends React.Component {

  renderEventList() {
    let events = this.props.events
    if (this.props.match.params.eventSlug && this.props.selectedEvent) {
      events = [this.props.selectedEvent]
    }

    return events.map((event)=>{
      const isActive = this.props.selectedEvent === event
      return (
        <div
          key={event.facebook_id}
          className={`event-item event-${event.pk} ${isActive ? 'is-active' : ''}`}
          onClick={()=> {this.selectEvent(event); this.centerEvent(event)}}
        >
          <h4>{event.name}</h4>
          <Link to={`/events/${event.slug}`}>See event</Link>
          <div>@ {event.facebook_place.facebook_name}</div>
          <div>{moment(event.start_time).fromNow()}</div>
          {!isActive ? null :
            <div>
              <img src={event.image_url} alt="event art"/>
              <div>{moment(event.start_time).format("dddd, MMMM Do YYYY, h:mm:ss a")}</div>
              <span>{event.facebook_place.facebook_city}, {event.facebook_place.facebook_country}</span>
              <p>
                {event.description}
              </p>
            </div>
          }
        </div>
      )
    })
  }

  render() {
    const events = this.renderEventList()
    return (
      <div>{events}</div>
    )
  }
}
EventList.propTypes = {
  events: PropTypes.array,
  match: PropTypes.object,
  selectedEvent: PropTypes.object,
}

export default EventList
