import React from 'react'
import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'
import EventSearchControls from "./EventSearchControls"
import { StandaloneSearchBox } from "react-google-maps/lib/components/places/StandaloneSearchBox"
const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <div>{props.children}</div>
}))

class PlainEventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().startOf('hour')
    this.customRefs = {}
    this.state = {
      center: null,
      pageTitle: null,
      country: null,
      region: null,
      startTime: start,
      events: [],
      onSearchBoxMounted: ref => {
        this.customRefs.searchBox = ref
      },
      onPlacesChanged: () => {
        const places = this.customRefs.searchBox.getPlaces()
        const bounds = new window.google.maps.LatLngBounds()

        places.forEach(place => {
          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport)
          }
          else {
            bounds.extend(place.geometry.location)
          }
        })
        const nextMarkers = places.map(place => ({
          position: place.geometry.location,
        }))
        const nextCenter = _.get(nextMarkers, '0.position', this.state.center)
        this.setState({
          center: nextCenter,
          markers: nextMarkers,
          placeName: places[0].formatted_address,
        })
        this.getEvents(nextCenter.lat(), nextCenter.lng())
      }
    }
  }

  getEvents(lat=null, lng=null) {

  }


  render() {
    return (
      <div>
        <GoogleMapsWrapper
          googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAP_KEY}&libraries=geometry,drawing,places`} // libraries=geometry,drawing,places
          loadingElement={<div style={{ height: `100%`, width: `100%` }} >LOADING</div>}
          containerElement={<div style={{ height: `95vh`, width: `100vw` }} >CONTAINER</div>}
          mapElement={<div style={{ height: `0`, width: `0`}} >MAP</div>}
        >
          <StandaloneSearchBox
            ref={this.state.onSearchBoxMounted}
            bounds={this.state.bounds}
            onPlacesChanged={this.state.onPlacesChanged}
          >
            <input
              type="text"
              placeholder="Find Comedy Near..."
            />
          </StandaloneSearchBox>
          <button>Use My Location</button>
          <input type="submit" value="search"/>
          <div>EVENTS HERE</div>
        </GoogleMapsWrapper>
      </div>
    )
  }
}

export default PlainEventList
