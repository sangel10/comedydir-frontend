import React from 'react'
import axios from 'axios'
import moment from 'moment'
import queryString from 'query-string'
import _ from 'lodash'
import Helmet from 'react-helmet'

import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'

import EventSearchControls from "./EventSearchControls"
import MapMarkers from "./MapMarkers"
import PageControl from "./PageControl"
import EventList from "./EventList"

const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <div>{props.children}</div>
}))


class Main extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().startOf('hour').subtract(30, 'days')

    this.customRefs = {}
    this.state = {

      isListVisible: true,
      events: [],
      startTime: start,
      useCustomStartTime: false,
      isSearchPanelVisible: true,
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
      toggleSearchPanel: () => {
        console.log('toggle search panel')
        this.setState({
          isSearchPanelVisible: !this.state.isSearchPanelVisible,
        })
      },
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
              <MapMarkers
                places={this.state.places}
                selectedEvent={this.state.selectedEvent}
                match={this.props.match}
                selectEvent={this.selectEvent.bind(this)}
                onMarkerClick={this.onMarkerClick.bind(this)}
              />
            </GoogleMap>
          </div>
          <div className={`event-list event-list-${this.state.isSearchPanelVisible ? 'is-visible' : 'is-hidden'}`}>
            <div onClick={this.state.toggleSearchPanel} className="toggle-event-list-mobile">
              {this.state.isSearchPanelVisible ? "See Map" : "Show List"}
            </div>
            <EventSearchControls
              onSearchBoxMounted={this.state.onSearchBoxMounted.bind(this)}
              bounds={this.state.bounds}
              onPlacesChanged={this.state.onPlacesChanged.bind(this)}
              getUserLocation={this.getUserLocation.bind(this)}
              onDatetimeChange={this.onDatetimeChange.bind(this)}
              startTime={this.state.startTime}
              radius={this.state.radius}
              updateSelect={this.updateSelect.bind(this)}
              days={this.state.days}
              ordering={this.state.ordering}
              limit={this.state.limit}
            />
            <div onClick={this.state.toggleSearchPanel} className="toggle-event-list">
              {this.state.isSearchPanelVisible ? <i className="fa fa-chevron-left fa-2x" /> : <i className="fa fa-chevron-right fa-2x" />}
            </div>
            <div className="event-list__container">
              <div className="event-list__items">
                {this.state.loadingEvents ? 'Loading Events...' :
                  <div>
                    <p> Found {this.state.totalEvents} EVENTS:</p>
                    <EventList
                      events={this.state.events}
                      match={this.props.match}
                      selectedEvent={this.state.selectedEvent}
                      selectEvent={this.selectEvent.bind(this)}
                      centerEvent={this.centerEvent.bind(this)}
                    />
                    <PageControl
                      totalPages={parseInt(this.state.totalEvents / this.state.limit, 10)}
                      currentPage={this.state.page}
                      hasNextPage={this.state.hasNextPage}
                      onClick={this.onPageChanged.bind(this)}
                    />
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

export default Main
