import React from 'react'
import moment from 'moment'

import PropTypes from 'prop-types'
import MarkerWithLabel from "react-google-maps/lib/components/addons/MarkerWithLabel"

class MapMarkers extends React.Component {

  renderMarkers() {
    let markerSource = this.props.places
    if (this.props.match.params.eventSlug && this.props.selectedEvent) {
      markerSource = [this.props.selectedEvent.facebook_place]
      markerSource[0].events = [this.props.selectedEvent]
    }
    return markerSource.map(place=>{
      const position = {lat: parseFloat(place.latitude), lng: parseFloat(place.longitude)}
      return (
        <MarkerWithLabel
          key={place.pk}
          position={position}
          labelAnchor={position}
          labelStyle={{
            backgroundColor: "rgba(0,0,0,0.5)",
            fontSize: "16 px",
            padding: "5px",
            color: "white"
          }}
          onClick={()=>{
            this.props.selectEvent(place.events[0])
            this.props.onMarkerClick(place)
          }}
        >
          <div>
            {place.facebook_name} {moment(place.events[0].start_time).fromNow()}
          </div>
        </MarkerWithLabel>
      )
    })
  }


  render() {
    const markers = this.renderMarkers()
    return (
      <div>{markers}</div>
    )
  }
}
MapMarkers.propTypes = {
  places: PropTypes.array,
  selectedEvent: PropTypes.object,
  match: PropTypes.object,
  selectEvent: PropTypes.func,
  onMarkerClick: PropTypes.func,
}

export default MapMarkers
