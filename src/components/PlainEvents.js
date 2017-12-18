import React from 'react'
import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import { withGoogleMap, withScriptjs } from 'react-google-maps'
import { StandaloneSearchBox } from "react-google-maps/lib/components/places/StandaloneSearchBox"
import queryString from 'query-string'
import PlainEventList from './PlainEventList'
import LoadingSpinner from './LoadingSpinner'
import Helmet from 'react-helmet'

const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <div>{props.children}</div>
}))

class PlainEvents extends React.Component {
  constructor(props) {
    super(props)
    const start = moment().startOf('hour')
    this.customRefs = {}
    this.state = {
      center: {},
      placeName: null,
      country: null,
      region: null,
      startTime: start,
      events: [],
      loading: false,
      radius: 10,
      days: 14,
      page: 1,
      loadingMessage: "Loading...",
      ordering: 'start_time',
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

  componentDidMount() {
    this.getUserLocation()
  }

  componentDidUpdate(prevProps, prevState) {
    const valuesToWatch = ['center']
    for (const value of valuesToWatch) {
      if (this.state[value] !== prevState[value]) {
        console.log('value changed', value)
        this.getEvents()
        break
      }
    }
  }

  getLocationFromCoordinates(lat, lng) {
    this.setState({loading: true, loadingMessage: "Identifying your location"})
    const geocoder = new window.google.maps.Geocoder()
    var latlng = new window.google.maps.LatLng(lat, lng)

    geocoder.geocode({'latLng': latlng}, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          console.log('results of geocode', results[1], results[0].formatted_address)
          this.setState({
            placeName: results[0].formatted_address,
            loading: false,
          })
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

  getUserLocation() {
    if (navigator.geolocation) {
      this.setState({loading: true, loadingMessage: "Finding your location"})
      navigator.geolocation.getCurrentPosition((position) => {
        var pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        this.setState({
          center: {lat: parseFloat(pos.lat, 10), lng: parseFloat(pos.lng, 10)},
          loading: false,
        })
        this.getLocationFromCoordinates(pos.lat, pos.lng)
        // this.getEvents(parseFloat(pos.lat, 10), parseFloat(pos.lng, 10))
      }, () => {
        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getCenterAsValues(latitude, longitude) {
    const lat = latitude || (typeof this.state.center.lat === 'number' && this.state.center.lat) || this.state.center.lat() || undefined
    const lng = longitude || (typeof this.state.center.lng === 'number' && this.state.center.lng) || this.state.center.lng() || undefined
    return {lat, lng}
  }

  getEvents(latitude, longitude) {
    this.setState({loading: true, loadingMessage: `Find Events Near ${this.state.placeName}`})
    const baseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/events/events/`
    const queryParams={}
    // TODO: fix this
    // This is a hack, since sometimes the center is created using google maps and sometimes it's made by hand
    // e.g. when we set the center based on query params
    // const lat = latitude || (typeof this.state.center.lat === 'number' && this.state.center.lat) || this.state.center.lat() || undefined
    // const lng = longitude || (typeof this.state.center.lng === 'number' && this.state.center.lng) || this.state.center.lng() || undefined
    const {lat, lng} = this.getCenterAsValues(latitude, longitude)
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
        // this.state.getLocationFromEvents()
        this.setState({loading: false})
      })
      .catch(error=> {
        this.setState({loading: false})
        console.log(error)
      })

    let locationParams = _.pick(queryParams, 'latitude', 'longitude')
    locationParams.place_name = this.state.placeName || undefined
    locationParams = queryString.stringify(locationParams)
    // window.history.pushState({}, "", `/events?${locationParams}`)
    // this.props.history.push(`/events?${locationParams}`)
    // <Redirect to={`/events?${locationParams}`} />
  }


  render() {
    const title = this.state.placeName ? `Comedy events near: ${this.state.placeName}` : 'findlivecomedy.com'
    return (
      <div>
        <Helmet title={title} />
        <GoogleMapsWrapper
          googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAP_KEY}&libraries=geometry,drawing,places`} // libraries=geometry,drawing,places
          loadingElement={<div style={{ height: `100%`, width: `100%` }} >LOADING</div>}
          containerElement={<div style={{ height: `95vh`, width: `100vw` }} >CONTAINER</div>}
          mapElement={<div style={{ height: `0`, width: `0`}} >MAP</div>}
        >
          <StandaloneSearchBox
            ref={this.state.onSearchBoxMounted}
            onPlacesChanged={this.state.onPlacesChanged.bind(this)}
          >
            <input
              type="text"
              placeholder="Find Comedy Near..."
            />
          </StandaloneSearchBox>
          <button onClick={this.getUserLocation.bind(this)}>Use My Location</button>
          <input type="submit" value="search"/>
          {this.state.placeName ? <h1>{title}</h1> : null}
          <PlainEventList events={this.state.events} />
          <div>{this.state.loading ? <LoadingSpinner message={this.state.loadingMessage}/> : null}</div>
        </GoogleMapsWrapper>
      </div>
    )
  }
}

export default PlainEvents
