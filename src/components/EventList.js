import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'
import queryString from 'query-string'
import GoogleMapReact from 'google-map-react'
import MapMarker from './MapMarker'
import _ from 'lodash'
// const MapMarker = ({ text }) => <div>{text}</div>

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
    }
    this._onChildClick = this._onChildClick.bind(this)
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
        console.log('LOCATION', pos)
        this.setState({latitude: parseFloat(pos.lat, 10), longitude: parseFloat(pos.lng, 10)})
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getEvents() {
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
    axios.get(url)
      .then(response =>{
        this.setState({events: response.data.results})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      const isActive = this.state.selectedEvent === event.pk
      return (
        <div
          key={event.facebook_id}
          className={isActive ? 'is-active' : ''}
          onClick={()=> {this.selectEvent(event.pk)}}
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

  selectEvent(pk) {
    console.log('select event')
    this.setState({selectedEvent: pk})
  }

  getMarkers() {
    const places = []
    this.state.events.forEach(event=>{
      let index = _.findIndex(places, event.facebook_place)
      if (index === -1) {
        places.push(event.facebook_place)
        places[places.length-1].events = []
        index = places.length -1
      }
      places[index].events.push(event)
    })
    return places.map(place=>{
      const description = place.events.map(event=>{
        return `${event.name} - ${event.start_time}`
      })
      const descriptionString = description.join('')
      // console.log('description', description)
      return (
        <MapMarker
          key={place.pk}
          lat={place.latitude}
          lng={place.longitude}
          name={place.name}
          description={descriptionString}
          isSelected={this.state.selectedEvent === place.events[0].pk}
          onClick={()=> {this.selectEvent(place.events[0].pk)}}
          eventData={place.events[0]}
        >
        </MapMarker>
      )
    })
  }
  _onChildClick(key, childProps) {
    console.log('child clicked')
    const eventPk = childProps.eventData.pk
    if (this.state.selectedEvent === eventPk) {
      this.setState({selectedEvent: null})
      return
    }
    this.setState({selectedEvent: eventPk})
    // const index = this.props.events.findIndex(e => e.get('pk') === eventId)

    // if (this.props.onChildClick) {
    // this.props.onChildClick(index);
    // }
  }
  // TODO: move API key to env
  render() {
    const events = this.renderEvents()
    const markers = this.getMarkers()
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
        <div className="google-map-wrapper">
          <GoogleMapReact
            bootstrapURLKeys={{
              key: 'AIzaSyCfEghEN8EUWO5-w6aEof1vnc5xSFJ0f3U',
              language: 'en',
            }}
            callback="mycallback"
            center={{lat: this.state.latitude, lng: this.state.longitude}}
            defaultZoom={1}
            onChildClick={this._onChildClick}
          >
            {markers}
          </GoogleMapReact>
        </div>
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


window.mycallback = function() {
  console.log('callback ran')
}
