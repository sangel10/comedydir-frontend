import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'
import queryString from 'query-string'
// import GoogleMapReact from 'google-map-react'
// import MapMarker from './MapMarker'
import _ from 'lodash'
// import MapWithASearchBox from './MapWithASearchBox'
import MapSearch from './CustomMapWithASearchBox'
// const MapMarker = ({ text }) => <div>{text}</div>
import { Marker } from "react-google-maps"

class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().subtract(30, 'days')
    const end = moment().add(30, 'days')
    // const end = moment().add(24, 'hours')

    this.state = {
      events: [],
      // start_time: null,
      // end_time: null,
      start_time: start,
      end_time: end,
      latitude: 59.724465,
      longitude: 30.080121,
      selectedEvent: null,
      radius: 5000000,
      loadingEvents: false,
      places: [],
      getLocationFromEvents: () => {
        const places = []
        this.state.events.forEach(event=>{
          let index = _.findIndex(places, event.facebook_place)
          if (index === -1) {
            places.push(event.facebook_place)
            places[places.length-1].events = []
            index = places.length -1
          }
          places[index].events.push(event)
          this.setState({places: places})
        })
      }

    }
    this._onChildClick = this._onChildClick.bind(this)
  }

  componentDidMount() {
    this.getEvents()
    this.getUserLocation()
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.start_time !== nextState.start_time ||
        this.state.end_time !== nextState.end_time ||
        this.state.radius !== nextState.radius) {
      this.getEvents()
    }
  }

  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        console.log('LOCATION', pos)
        this.setState({latitude: parseFloat(pos.lat, 10), longitude: parseFloat(pos.lng, 10)})
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getEvents(latitude, longitude) {
    const baseUrl = 'http://127.0.0.1:8000/events/events/'
    const queryParams={}
    this.setState({loadingEvents: true})
    if (this.state.radius) {
      queryParams.radius = this.state.radius
    }
    if (this.state.start_time) {
      queryParams.start_time = this.state.start_time.unix()
    }
    if (this.state.end_time) {
      queryParams.end_time = this.state.end_time.unix()
    }
    // if (this.state.latitude) {
    queryParams.latitude = latitude || this.state.latitude || undefined
    // }
    // if (this.state.longitude) {
    queryParams.longitude = longitude || this.state.longitude || undefined
    // }
    const params = queryString.stringify(queryParams)
    const url = `${baseUrl}?${params}`
    axios.get(url)
      .then(response =>{
        this.setState({events: response.data.results})
        this.state.getLocationFromEvents()
        this.setState({loadingEvents: false})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      const isActive = this.state.selectedEvent === event
      return (
        <div
          key={event.facebook_id}
          className={isActive ? 'is-active' : ''}
          onClick={()=> {this.selectEvent(event)}}
        >
          <h4>{event.name}</h4>
          <img src={event.image_url} alt="event art"/>
          <div>{moment(event.start_time).format("dddd, MMMM Do YYYY, h:mm:ss a")}</div>
          <div>{moment(event.start_time).fromNow()}</div>
          <span>{event.facebook_place.facebook_city}</span>
          <span>{event.facebook_place.facebook_country}</span>
        </div>
      )
    })
  }

  onChange(variable, e) {
    const obj = {}
    obj[variable] = moment(e._d)
    this.setState(obj)
  }

  selectEvent(event) {
    console.log('select event')
    this.setState({selectedEvent: event})
  }

  getMarkers() {
    return this.state.places.map(place=>{
      // const description = place.events.map(event=>{
      //   return `${event.name} - ${event.start_time}`
      // })
      // const isSelected = this.state.selectedEvent && (_.findIndex(place.events, this.state.selectedEvent) !== -1)
      const position = {lat: parseFloat(place.latitude), lng: parseFloat(place.longitude)}
      return (
        <Marker
          key={place.pk}
          position={position}
          onClick={()=>{this.selectEvent(place.events[0])}}
        />
      )
    })
  }

  _onChildClick(key, childProps) {
    console.log('child clicked')
    const eventData = childProps.eventData
    if (this.state.selectedEvent === eventData) {
      this.setState({selectedEvent: null})
      return
    }
    this.setState({selectedEvent: eventData})
  }

  onRadiusChange(e) {
    console.log('radius change,', e.target.value)
    this.setState({radius: e.target.value})
  }
  //
  // testing() {
  //   console.log('test')
  // }

  // onBoundsChanged(bounds, center) {
  //   console.log('BOUNDS CHANGEd', center.lat(), center.lng())
  //   // this.setState({lat: center.lat(), lng: center.lng()})
  // }

  // onCenterChanged(e) {
  //   console.log('center changed', e)
  // }

  onPlacesChanged(nextCenter) {
    console.log('places changed, nextCenter', nextCenter)
    this.setState({lat: nextCenter.lat(), lng: nextCenter.lng()})
    this.getEvents(nextCenter.lat(), nextCenter.lng())
  }

  render() {
    const events = this.renderEvents()
    const markers = this.getMarkers()
    return (
      <div className="events-container">
        <div className="google-map-wrapper">
          <MapSearch
            defaultCenter={{lat: this.state.latitude, lng: this.state.longitude}}
            onPlacesChanged={this.onPlacesChanged.bind(this)}
          >
            {markers}
          </MapSearch>
        </div>
        <div className="event-list">
          <Datetime
            defaultValue={this.state.start_time}
            onBlur={(e)=>{this.onChange('start_time', e)}}
          />
          <Datetime
            defaultValue={this.state.end_time}
            onBlur={(e)=>{this.onChange('end_time', e)}}
          />
          <div>Radius</div>
          <input
            type="range"
            value={this.state.radius}
            onChange={this.onRadiusChange.bind(this)}
            max="1000000"
            min="100"
            step="100000"
          />
          {this.state.loadingEvents ? 'Loading Events...' :
            <div>
              <h3> Found {this.state.events.length} EVENTS:</h3>
              {events}
            </div>
          }

        </div>
      </div>
    )
  }
}

EventList.propTypes = {
  match: PropTypes.object,
}

export default EventList
