import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'
import queryString from 'query-string'
// import CustomGoogleMap from './CustomGoogleMap'
import GoogleMapWithMarkers from './GoogleMapWithMarkers'

class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment()
    const end = moment().add(24, 'hours')

    this.state = {
      events: [],
      // start_time: null,
      // end_time: null,
      start_time: start,
      end_time: end,
      latitude: null,
      longitude: null,
    }
    // this.getUserLocation = this.getUserLocation.bind(this)
  }

  componentDidMount() {
    this.getEvents()
    this.getUserLocation()
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.start_time !== nextState.start_time ||
        this.state.end_time !== nextState.end_time) {
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
        console.log('GOT POSITION', pos)
        this.setState({latitude: pos.lat, longitude: pos.lng})
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getEvents() {
    console.log('get events')
    const {country_slug, region_slug, city_slug} = this.props.match.params
    const baseUrl = 'http://127.0.0.1:8000/events/events/'
    const queryParams={}
    if (city_slug) {
      queryParams.region = city_slug
    }
    if (region_slug) {
      queryParams.region = region_slug
    }
    if (country_slug) {
      queryParams.country = country_slug
    }
    if (this.state.start_time) {
      queryParams.start_time = this.state.start_time.unix()
    }
    if (this.state.end_time) {
      queryParams.end_time = this.state.end_time.unix()
    }
    const params = queryString.stringify(queryParams)
    // url = `${url}?format=json&start_time=${this.state.start_time.unix()}&end_time=${this.state.end_time.unix()}`
    const url = `${baseUrl}?${params}`
    console.log('URL', url)
    axios.get(url)
      .then(response =>{
        console.log('EVENTs', response.data.results)
        this.setState({events: response.data.results})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      return (
        <div key={event.facebook_id}>
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

  render() {
    const events = this.renderEvents()
    return (
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
        <div>Country</div>
        <div>Region</div>
        <div>Sort by: Start Time or Distance</div>
        <div>City</div>
        <CustomGoogleMap />
        <GoogleMapWithMarkers
          googleMapURL="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places"
          loadingElement={<div style={{ height: `100%` }} />}
          containerElement={<div style={{ height: `400px` }} />}
          mapElement={<div style={{ height: `100%` }} />}
          centerLatitude={this.state.latitude}
          centerLongitude={this.state.longitude}
          events={this.state.events}
        />

        <h3> Found {this.state.events.length} EVENTS:</h3>
        {events}
      </div>
    )
  }
}

EventList.propTypes = {
  match: PropTypes.object,
}

export default EventList
