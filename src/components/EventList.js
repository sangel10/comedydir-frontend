import React from 'react'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'
import queryString from 'query-string'
import _ from 'lodash'
import MarkerWithLabel from "react-google-maps/lib/components/addons/MarkerWithLabel"

import Select from 'react-select'

import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'
import MarkerClusterer from "react-google-maps/lib/components/addons/MarkerClusterer"
import { StandaloneSearchBox } from "react-google-maps/lib/components/places/StandaloneSearchBox"
import PageControl from "./PageControl"

const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <div>{props.children}</div>
}))


class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().startOf('hour').subtract(30, 'days')

    this.customRefs = {}
    this.state = {

      events: [],
      start_time: start,
      ordering: 'start_time',
      selectedEvent: null,
      totalEvents: null,
      radius: 10,
      limit: 50, // TODO: hardcoded for now, in the future find a way to get this from the API
      days: 1,
      page: 1,
      hasNextPage: false,
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
          // TODO: this feels like the wrong location, but
          // it doesn't seem to work when we call it from componentDidUpdate
          this.fitBoundsToEvents()
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
    // this.getUserLocation()
    const params = queryString.parse(window.location.search)
    const nextState = {}
    if (!params.latitude || !params.longitude) {
      console.log('NO LAT AND LNG')
      this.getUserLocation()
      return
    }
    // nextState.center = {
    //   lat: ()=>{
    //     parseInt(params.latitude, 10)
    //   },
    //   lng: ()=>{
    //     parseInt(params.longitude, 10)
    //   }
    // }
    nextState.center = {
      lat: parseFloat(params.latitude, 10),
      lng: parseFloat(params.longitude, 10),
    }
    // nextState.center = {lat: parseInt(params.latitude, 10), lng: parseInt(params.longitude, 10)}
    // nextState.center = new window.google.maps.LatLng(params.latitude, params.longitude)
    nextState.page = parseInt(params.page, 10) || undefined
    nextState.days = parseInt(params.days, 10) || undefined
    nextState.radius = parseFloat(params.radius) || undefined
    nextState.ordering = params.ordering || undefined
    nextState.start_time = params.start_time ? moment(parseInt(params.start_time, 10)) : undefined
    const cleanNextState = _.omitBy(nextState, _.isUndefined)
    console.log('CLEAN STATE', cleanNextState)
    this.setState(cleanNextState)
    // this.getEvents(params.latitude, params.longitude)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.start_time !== prevState.start_time ||
      this.state.radius !== prevState.radius ||
      this.state.days !== prevState.days ||
      this.state.ordering !== prevState.ordering ||
      this.state.page !== prevState.page
    ) {
      this.getEvents()
    }
    // This doesn't seem to work, it is not clear why!
    // if (this.state.places !== prevState.places) {
    //   this.fitBoundsToEvents('did update')
    // }
  }


  fitBoundsToEvents() {
    if (!this.customRefs.map) {
      return
    }
    if (typeof !this.customRefs.map === 'undefined') {
      return
    }
    const bounds = new window.google.maps.LatLngBounds()
    this.state.places.forEach(place => {
      if (place.latitude && place.longitude) {
        const myPlace = new window.google.maps.LatLng(place.latitude, place.longitude)
        bounds.extend(myPlace)
      }
    })
    bounds.extend(this.state.center)
    this.customRefs.map.fitBounds(bounds)
  }


  getUserLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        this.setState({
          center: {lat: parseFloat(pos.lat, 10), lng: parseFloat(pos.lng, 10)}
        })
        this.getEvents(parseFloat(pos.lat, 10), parseFloat(pos.lng, 10))
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getEvents(latitude, longitude) {
    this.setState({loadingEvents: true})
    const baseUrl = 'http://127.0.0.1:8000/events/events/'
    const queryParams={}
    // TODO: fix this
    // This is a hack, since somtimes the center is created using google maps and sometimes it's made by hands
    // e.g. when we set the center based on query params
    const lat = latitude || (typeof this.state.center.lat === 'number' && this.state.center.lat) || this.state.center.lat() || undefined
    const lng = longitude || (typeof this.state.center.lng === 'number' && this.state.center.lng) || this.state.center.lng() || undefined
    if (!lat || !lng) {
      return
    }
    queryParams.radius = this.state.radius || undefined
    queryParams.start_time = this.state.start_time ? this.state.start_time.unix() : undefined
    queryParams.latitude = lat
    queryParams.longitude = lng
    queryParams.days = this.state.days || undefined
    queryParams.page = this.state.page || undefined
    queryParams.ordering = this.state.ordering || undefined
    const params = queryString.stringify(queryParams)
    const url = `${baseUrl}?${params}`
    axios.get(url)
      .then(response =>{
        this.setState({
          events: response.data.results,
          hasNextPage: response.data.next !== null,
          totalEvents: response.data.count
        })
        this.state.getLocationFromEvents()
        this.setState({loadingEvents: false})
      })

    let locationParams = _.pick(queryParams, 'latitude', 'longitude')
    locationParams = queryString.stringify(locationParams)
    window.history.pushState({}, "", `${window.location.pathname}?${locationParams}`)
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      const isActive = this.state.selectedEvent === event
      return (
        <div
          key={event.facebook_id}
          className={`event-${event.pk} ${isActive ? 'is-active' : ''}`}
          onClick={()=> {this.selectEvent(event); this.centerEvent(event)}}
        >
          <h4>{event.name}</h4>
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

  onDatetimeChange(variable, e) {
    const obj = {}
    // Round to the nearest hour to prevent cache busting by unique timestamps
    obj[variable] = moment(e._d).startOf('hour')
    this.setState(obj)
  }

  selectEvent(event) {
    if (this.state.selectedEvent && (event.pk === this.state.selectedEvent.pk)) {
      this.setState({selectedEvent: null})
      return
    }
    this.setState({selectedEvent: event})
  }

  onMarkerClick(place) {
    this.setState({lat: place.latitude, lng: place.longitude})
    const eventClass = `event-${place.events[0].pk}`
    const element = document.getElementsByClassName(eventClass)[0]
    window.scrollTo({
      'behavior': 'smooth',
      'top': element.offsetTop + 100
    })
  }

  getMarkers() {
    return this.state.places.map(place=>{
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
            this.onMarkerClick(place)
          }}
        >
          <div>
            {place.facebook_name} {moment(place.events[0].start_time).fromNow()}
          </div>
        </MarkerWithLabel>
      )
    })
  }

  updateSelect(key, e) {
    if (!e || !e.value) {
      return
    }
    const obj = {}
    obj[key] = e.value
    // reset page when search params change
    obj.page = 1
    this.setState(obj)
  }


  onPageChanged(newPage) {
    this.setState({
      page: newPage
    })
  }

  centerEvent(event) {
    if (!this.customRefs.map) {
      return
    }
    const place = event.facebook_place
    const myPlace = new window.google.maps.LatLng(place.latitude, place.longitude)
    this.setState({center: myPlace })
  }

  render() {
    const events = this.renderEvents()
    const markers = this.getMarkers()
    const radiusSelectOptions = [
      { value: 0.5, label: '0.5', clearableValue: false},
      { value: 1, label: '1', clearableValue: false},
      { value: 2, label: '2', clearableValue: false},
      { value: 3, label: '3', clearableValue: false},
      { value: 5, label: '5', clearableValue: false},
      { value: 10, label: '10', clearableValue: false},
      { value: 50, label: '50', clearableValue: false},
      { value: 100, label: '100', clearableValue: false},
      { value: 500, label: '500', clearableValue: false},
      { value: 1000, label: '1000', clearableValue: false},
    ]
    const daysSelectOptions = [
      { value: 1, label: '1', clearableValue: false},
      { value: 2, label: '2', clearableValue: false},
      { value: 3, label: '3', clearableValue: false},
      { value: 7, label: '7', clearableValue: false},
      { value: 14, label: '14', clearableValue: false},
      { value: 30, label: '30', clearableValue: false},
    ]
    const orderingSelectOptions = [
      { value: 'distance_from_target', label: 'Distance', clearableValue: false},
      { value: 'start_time', label: 'Start time', clearableValue: false},
    ]
    return (
      <div className="events-container">
        <GoogleMapsWrapper
          googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMh8-5D3mJSXspmJrhSTtt0ToGiA-JLBc&libraries=geometry,drawing,places" // libraries=geometry,drawing,places
          loadingElement={<div style={{ height: `100vh`, width: `100vw` }} >LOADING</div>}
          containerElement={<div style={{ height: `100vh`, width: `100vw` }} >CONTAINER</div>}
          mapElement={<div style={{ height: `100vh`, width: `100vw`}} >MAP</div>}
        >
          <div className="google-map-wrapper">
            <GoogleMap
              defaultZoom={12}
              defaultCenter={this.state.center}
              center={this.state.center}
              onMapMounted={this.state.onMapMounted}
              onBoundsChanged={this.state.onBoundsChanged}
              onCenterChanged={this.onCenterChanged.bind(this)}
              ref={this.state.onMapMounted}
            >
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
            </GoogleMap>

          </div>
          <div className="event-list">
            <div className="event-controls">
              <StandaloneSearchBox
                ref={this.state.onSearchBoxMounted}
                bounds={this.state.bounds}
                onPlacesChanged={this.state.onPlacesChanged}
              >
                <input
                  type="text"
                  placeholder="Search For events near this location"
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
              </StandaloneSearchBox>
              <Datetime
                defaultValue={this.state.start_time}
                onChange={(e)=>{this.onDatetimeChange('start_time', e)}}
              />
              Radius
              <Select
                name="radius-select"
                type="number"
                value={this.state.radius}
                options={radiusSelectOptions}
                onChange={(e)=>{this.updateSelect('radius', e)}}
              />
              Days
              <Select
                name="days-select"
                type="number"
                value={this.state.days}
                options={daysSelectOptions}
                onChange={(e)=>{this.updateSelect('days', e)}}
              />
              Order By
              <Select
                name="ordering-select"
                type="number"
                value={this.state.ordering}
                options={orderingSelectOptions}
                onChange={(e)=>{this.updateSelect('ordering', e)}}
              />
              <PageControl
                totalPages={parseInt(this.state.totalEvents / this.state.limit, 10)}
                currentPage={this.state.page}
                hasNextPage={this.state.hasNextPage}
                onClick={this.onPageChanged.bind(this)}
              />
            </div>
            <div className="event-list__container">
              <div className="event-list__items">
                {this.state.loadingEvents ? 'Loading Events...' :
                  <div>
                    <h3> Found {this.state.totalEvents} EVENTS:</h3>
                    {events}
                  </div>
                }
              </div>
            </div>
          </div>
        </GoogleMapsWrapper>
      </div>
    )
  }
}

export default EventList
