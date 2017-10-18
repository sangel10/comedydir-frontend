import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'
import queryString from 'query-string'
import _ from 'lodash'
import MarkerWithLabel from "react-google-maps/lib/components/addons/MarkerWithLabel"

import Select from 'react-select'

import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'
import MarkerClusterer from "react-google-maps/lib/components/addons/MarkerClusterer"
import SearchBox from "react-google-maps/lib/components/places/SearchBox"


const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <GoogleMap {...props} ref={props.onMapMounted}>{props.children}</GoogleMap>
}))



class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().subtract(30, 'days')
    const end = moment().add(30, 'days')
    // const end = moment().add(24, 'hours')

    this.customRefs = {}
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
      },
      markers: [],
      onMapMounted: map => {
        this.customRefs.map = map
      },
      onSearchBoxMounted: ref => {
        this.customRefs.searchBox = ref
      },
      onBoundsChanged: () => {
        // this.props.onBoundsChanged(refs.map.getBounds(), refs.map.getCenter())
        // console.log(refs.map) // (not a Container, a Map) Map {props: {…}, context: {…}, refs: {…}, updater: {…}, _reactInternalFiber: FiberNode, …}
        this.setState({
          bounds: this.customRefs.map.getBounds(),
          center: this.customRefs.map.getCenter()
        })
      },
      onCenterChanged: () => {
        // this.props.onBoundsChanged(refs.map.getBounds(), refs.map.getCenter())
        // console.log(refs.map) // (not a Container, a Map) Map {props: {…}, context: {…}, refs: {…}, updater: {…}, _reactInternalFiber: FiberNode, …}
        this.setState({
          bounds: this.customRefs.map.getBounds(),
          center: this.customRefs.map.getCenter()
        })
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
        })
        this.customRefs.map.fitBounds(bounds)
        this.getEvents(nextCenter.lat(), nextCenter.lng())
      }
    }
  }

  componentDidMount() {
    this.getEvents()
    this.getUserLocation()
  }

  addMarkerWithLabelScript () {
    console.log('adding script')
    if (window.MarkerWithLabel) {
      return
    }
    const script = document.createElement("script")
    script.src = "//cdn.rawgit.com/googlemaps/v3-utility-library/master/markerwithlabel/src/markerwithlabel.js"
    script.async = true
    document.body.appendChild(script)
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.start_time !== nextState.start_time ||
        this.state.end_time !== nextState.end_time ||
        this.state.radius !== nextState.radius) {
      console.log('events in update');
      this.getEvents()
    }
  }

  getUserLocation() {
    console.log('get user location')
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        console.log('LOCATION', pos)
        this.setState({
          latitude: parseFloat(pos.lat, 10),
          longitude: parseFloat(pos.lng, 10),
          center: {lat: parseFloat(pos.lat, 10), lng: parseFloat(pos.lng, 10)}
        })
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
          <span>{event.facebook_place.facebook_city}, {event.facebook_place.facebook_country}</span>
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
    console.log('select event', event.pk, this.state.selectedEvent && this.state.selectedEvent.pk)
    if (this.state.selectedEvent && (event.pk === this.state.selectedEvent.pk)) {
      console.log('setting null')
      this.setState({selectedEvent: null})
      return
    }
    this.setState({selectedEvent: event})
  }

  onLocationClick(place) {
    console.log('click location', place)
    this.setState({lat: place.latitude, lng: place.longitude})
  }

  onCenterChanged(e) {
    console.log('update center', e)
  }

  getMarkers() {
    return this.state.places.map(place=>{
      // const description = place.events.map(event=>{
      //   return `${event.name} - ${event.start_time}`
      // })
      const isSelected = this.state.selectedEvent && (_.findIndex(place.events, this.state.selectedEvent) !== -1)
      console.log('selected', isSelected)
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
            this.selectEvent(place.events[0])
            this.onLocationClick(place)
          }}
        >
          <div>{place.facebook_name} {moment(place.events[0].start_time).fromNow()}
              {isSelected ? place.events[0].description : null}
          </div>
        </MarkerWithLabel>
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

  // onPlacesChanged(nextCenter) {
  //   console.log('places changed, nextCenter', nextCenter)
  //   this.setState({lat: nextCenter.lat(), lng: nextCenter.lng()})
  //   this.getEvents(nextCenter.lat(), nextCenter.lng())
  // }

  render() {
    const events = this.renderEvents()
    const markers = this.getMarkers()
    // const selectOptions= [
    //   1: 1,
    //   2: 2,
    //   3: 3,
    //   7: 7,
    //   30: 30,
    // ]
    const selectOptions = [
      { value: '1', label: 1 },
      { value: '2', label: 2 },
      { value: '3', label: 3 },
      { value: '7', label: 7 },
      { value: '30', label: 30 },
    ]
    return (
      <div className="events-container">
        <div className="google-map-wrapper">
          <GoogleMapsWrapper
            googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMh8-5D3mJSXspmJrhSTtt0ToGiA-JLBc&libraries=geometry,drawing,places" // libraries=geometry,drawing,places
            loadingElement={<div style={{ height: `100%` }} />}
            containerElement={<div style={{ height: `100%` }} />}
            mapElement={<div style={{ height: `100%` }} />}
            defaultZoom={12}
            defaultCenter={{lat: this.state.latitude, lng: this.state.longitude}}
            center={this.state.center}
            onMapMounted={this.state.onMapMounted}
            onBoundsChanged={this.state.onBoundsChanged}
            onCenterChanged={this.onCenterChanged.bind(this)}
          >
            <SearchBox
              ref={this.state.onSearchBoxMounted}
              bounds={this.state.bounds}
              controlPosition={window.google && window.google.maps.ControlPosition.TOP_RIGHT}
              onPlacesChanged={this.state.onPlacesChanged}
            >
              <input
                type="text"
                placeholder="Enter your location"
                style={{
                  boxSizing: `border-box`,
                  border: `1px solid transparent`,
                  width: `240px`,
                  height: `32px`,
                  marginTop: `27px`,
                  padding: `0 12px`,
                  borderRadius: `3px`,
                  boxShadow: `0 2px 6px rgba(0, 0, 0, 0.3)`,
                  fontSize: `14px`,
                  outline: `none`,
                  textOverflow: `ellipses`,
                }}
              />
            </SearchBox>
            <MarkerClusterer
              averageCenter
              enableRetinaIcons
              gridSize={60}
            >
              {this.props.children}
            </MarkerClusterer>
            {markers}
            <button className="my-location-button"
              onClick={this.getUserLocation.bind(this)}>
              My Location
            </button>
          </GoogleMapsWrapper>

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
          Select Duration
          <Select
            name="form-field-name"
            type="number"
            value="1"
            options={selectOptions}
            onChange={this.updateSelect}
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

export default EventList
