import React from 'react'
import axios from 'axios'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import queryString from 'query-string'
import _ from 'lodash'
import MarkerWithLabel from "react-google-maps/lib/components/addons/MarkerWithLabel"
import { Link } from 'react-router-dom'
import Select from 'react-select'
import Helmet from 'react-helmet'

import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'
import { StandaloneSearchBox } from "react-google-maps/lib/components/places/StandaloneSearchBox"
import PageControl from "./PageControl"
import MyLocationIcon from "./MyLocationIcon"

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
      startTime: start,
      useCustomStartTime: false,
      ordering: 'start_time',
      selectedEvent: null,
      totalEvents: null,
      radius: 10,
      limit: 50, // TODO: hardcoded for now, in the future find a way to get this from the API
      days: 7,
      page: 1,
      hasNextPage: false,
      loadingEvents: false,
      placeName: null,
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
          placeName: places[0].formatted_address,
        })
        this.customRefs.map.fitBounds(bounds)
        this.getEvents(nextCenter.lat(), nextCenter.lng())
      }
    }
  }


  componentDidMount() {
    // this.getUserLocation()
    if (this.props.match.params.eventSlug) {
      this.getSelectedEvent(this.props.match.params.eventSlug)
      return
    }
    const params = queryString.parse(window.location.search)
    const nextState = {}
    if (!params.latitude || !params.longitude) {
      this.getUserLocation()
      return
    }

    nextState.center = {
      lat: parseFloat(params.latitude, 10),
      lng: parseFloat(params.longitude, 10),
    }
    nextState.page = parseInt(params.page, 10) || undefined
    nextState.days = parseInt(params.days, 10) || undefined
    nextState.radius = parseFloat(params.radius) || undefined
    nextState.ordering = params.ordering || undefined
    nextState.startTime = params.start_time ? moment(parseInt(params.start_time, 10)) : undefined
    nextState.placeName = params.place_name || undefined
    const cleanNextState = _.omitBy(nextState, _.isUndefined)
    this.setState(cleanNextState)
    this.getEvents(params.latitude, params.longitude)
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.startTime !== prevState.startTime ||
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
        this.getLocationFromCoordinates(pos.lat, pos.lng)
        this.getEvents(parseFloat(pos.lat, 10), parseFloat(pos.lng, 10))
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getLocationFromCoordinates(lat, lng) {
    const geocoder = new window.google.maps.Geocoder()
    var latlng = new window.google.maps.LatLng(lat, lng)
    geocoder.geocode({'latLng': latlng}, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          this.setState({placeName: results[0].formatted_address})
        }
        else {
          console.log("No results found")
        }
      }
      else {
        console.log("Geocoder failed due to: ", status)
      }
    })
  }

  getSelectedEvent(slug) {
    const eventId = slug.split('-')[0]
    const url = `${process.env.REACT_APP_BACKEND_API_URL}/events/events/${eventId}`
    this.setState({loadingEvents: true})
    axios.get(url)
      .then(response =>{
        console.log('selected event RESPONSE', response)
        this.setState({
          selectedEvent: response.data,
          loadingEvents: false,
          center: {lat: parseFloat(response.data.facebook_place.latitude, 10), lng: parseFloat(response.data.facebook_place.longitude, 10)}
        })
      })
  }

  getEvents(latitude, longitude) {
    this.setState({loadingEvents: true})
    const baseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/events/events/`
    const queryParams={}
    // TODO: fix this
    // This is a hack, since sometimes the center is created using google maps and sometimes it's made by hand
    // e.g. when we set the center based on query params
    const lat = latitude || (typeof this.state.center.lat === 'number' && this.state.center.lat) || this.state.center.lat() || undefined
    const lng = longitude || (typeof this.state.center.lng === 'number' && this.state.center.lng) || this.state.center.lng() || undefined
    if (!lat || !lng) {
      return
    }
    queryParams.radius = this.state.radius || undefined
    queryParams.start_time = this.state.startTime ? this.state.startTime.unix() : undefined
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
    locationParams.place_name = this.state.placeName || undefined
    locationParams = queryString.stringify(locationParams)
    // window.history.pushState({}, "", `/events?${locationParams}`)
    this.props.history.push(`/events?${locationParams}`)
    // <Redirect to={`/events?${locationParams}`} />
  }


  renderEventList() {
    let events = this.state.events
    if (this.props.match.params.eventSlug && this.state.selectedEvent) {
      events = [this.state.selectedEvent]
      // this.state.selectedEvent.facebook_place.events = [this.state.selectedEvent]
    }

    return events.map((event)=>{
      const isActive = this.state.selectedEvent === event
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

  onDatetimeChange(variable, e) {
    const obj = {}
    // Round to the nearest hour to prevent cache busting by unique timestamps
    obj[variable] = moment(e._d).startOf('hour')
    obj.useCustomStartTime = true
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
    const container = document.getElementsByClassName('event-list__container')[0]
    container.scrollTo({
      'behavior': 'smooth',
      'top': element.offsetTop + 100
    })
  }

  renderMarkers() {
    let markerSource = this.state.places
    if (this.props.match.params.eventSlug && this.state.selectedEvent) {
      markerSource = [this.state.selectedEvent.facebook_place]
      markerSource[0].events = [this.state.selectedEvent]
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

  getTitle() {
    if (this.state.selectedEvent) {
      return `${this.state.selectedEvent.name} ${this.state.selectedEvent.facebook_place.facebook_city}, ${this.state.selectedEvent.facebook_place.facebook_country} | Find Live Comedy`
    }
    if (this.state.events.length && this.state.placeName) {
      return `Comedy events near ${this.state.placeName} | Find Live Comedy`
    }
    return null
  }

  render() {
    const events = this.renderEventList()
    const markers = this.renderMarkers()
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

    const title = this.getTitle()

    return (
      <div className="events-container">
        <Helmet title={title} />
        <GoogleMapsWrapper
          googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAP_KEY}&libraries=geometry,drawing,places`} // libraries=geometry,drawing,places
          loadingElement={<div style={{ height: `100%`, width: `100%` }} >LOADING</div>}
          containerElement={<div style={{ height: `95vh`, width: `100vw` }} >CONTAINER</div>}
          mapElement={<div style={{ height: `100%`, width: `100%`}} >MAP</div>}
        >
          <div className="google-map-wrapper">
            <GoogleMap
              defaultZoom={12}
              defaultCenter={this.state.center}
              center={this.state.center}
              onMapMounted={this.state.onMapMounted}
              onBoundsChanged={this.state.onBoundsChanged}
              onCenterChanged={this.state.onCenterChanged}
              ref={this.state.onMapMounted}
            >
              {markers}
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
                  placeholder="Find Events Near..."
                />
              </StandaloneSearchBox>
              <button className="my-location-button"
                onClick={this.getUserLocation.bind(this)}>
                <MyLocationIcon/>
              </button>
              <div className="form-fields">
                <label htmlFor="datepicker">Start Date</label>
                <DatePicker
                  selected={this.state.startTime}
                  id="datepicker"
                  onChange={(e)=>{this.onDatetimeChange('startTime', e)}}
                  showTimeSelect
                />
                <label htmlFor="radius-select">Radius in km</label>
                <Select
                  name="radius-select"
                  type="number"
                  value={this.state.radius}
                  options={radiusSelectOptions}
                  onChange={(e)=>{this.updateSelect('radius', e)}}
                />
                <label htmlFor="days-select">Days</label>
                <Select
                  name="days-select"
                  type="number"
                  value={this.state.days}
                  options={daysSelectOptions}
                  onChange={(e)=>{this.updateSelect('days', e)}}
                />
                <label htmlFor="ordering-select">Order By</label>
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
