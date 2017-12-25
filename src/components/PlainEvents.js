import React from 'react'
import moment from 'moment'
import axios from 'axios'
import _ from 'lodash'
import { withGoogleMap, withScriptjs } from 'react-google-maps'
import queryString from 'query-string'
import PlainEventList from './PlainEventList'
import LoadingSpinner from './LoadingSpinner'
import Helmet from 'react-helmet'
import PlainEventSearchControls from './PlainEventSearchControls'
import PlainEventDetail from './PlainEventDetail'
import PageControl from './PageControl'
import { Route, Switch } from 'react-router-dom'

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
      startTime: start,
      events: [],
      loading: false,
      radius: 10,
      days: 14,
      page: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      shareUrl: null,
      ordering: 'start_time',
      limit: 50,
      totalEvents: 0,
      loadingMessage: "Loading...",
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
      },
      onPageChange(change) {
        this.setState({page: (this.state.page + change)})
      }
    }
  }

  componentDidMount() {
    if (this.props.match.params.eventSlug) {
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
    nextState.startTime = params.start_time ? moment.unix(parseInt(params.start_time, 10)) : undefined
    nextState.placeName = params.place_name || undefined
    const cleanNextState = _.omitBy(nextState, _.isUndefined)
    console.log('parsed time', params.start_time, moment.unix(parseInt(params.start_time, 10)))
    this.setState(cleanNextState)
    // this.getEvents(params.latitude, params.longitude)
  }

  componentDidUpdate(prevProps, prevState) {
    const valuesToWatch = ['center', 'startTime', 'radius', 'days', 'ordering']
    for (const value of valuesToWatch) {
      if (this.state[value] !== prevState[value]) {
        this.setState({page: 1})
        this.getEvents()
        break
      }
    }
    // TODO: This is ineffient, if the search params have changed we go through another
    // entire lifecycle to reset the page to 1, but that means we make a potentially costly
    // DB call with the wrong page.
    // I'm leaving this in as it only happens when people are on pages >1, which is rare right now
    // But could potentially cause problems later
    if (this.state.page !== prevState.page) {
      this.getEvents()
    }
  }

  getLocationFromCoordinates(lat, lng) {
    // Hacky solution to a race condition
    if (!window.google || !window.google.maps) {
      window.setTimeout(()=> {
        this.getLocationFromCoordinates(lat, lng)
      }, 100)
      return
    }
    this.setState({loading: true, loadingMessage: "Identifying your location"})
    const geocoder = new window.google.maps.Geocoder()
    var latlng = new window.google.maps.LatLng(lat, lng)

    geocoder.geocode({'latLng': latlng}, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK) {
        if (results[1]) {
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
      }, (e) => {
        console.log(e)
        this.setState({loading: false, loadingMessage: "Finding your location"})

        // handleLocationError(true, infoWindow, map.getCenter());
      })
    }
  }

  getCenterAsValues(latitude, longitude) {
    // TODO: fix this
    // This is a hack, since sometimes the center is created using google maps and sometimes it's made by hand
    // e.g. when we set the center based on query params
    if (latitude && longitude) {
      return {lat: latitude, lng: longitude}
    }
    const lat = (typeof this.state.center.lat === 'number' && this.state.center.lat) || this.state.center.lat() || undefined
    const lng = (typeof this.state.center.lng === 'number' && this.state.center.lng) || this.state.center.lng() || undefined
    return {lat: lat, lng: lng}
  }

  refreshEvents() {
    if (this.state.center.lat && this.state.center.lng) {
      this.getEvents()
      return
    }
    this.getUserLocation()
  }

  getEvents(latitude, longitude) {
    // console.log('get events');
    // if ((!latitude || !latitude) && (!this.state.center.lat || !this.state.center.lat)) {
    //   this.getUserLocation()
    //   return
    // }
    this.setState({loading: true, loadingMessage: `Find Events Near ${this.state.placeName}`})
    const baseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/events/events/`
    const queryParams={}
    const {lat, lng} = this.getCenterAsValues(latitude, longitude)
    if (!lat || !lng) {
      this.setState({loading: false})
      // this.getUserLocation()
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
          hasPreviousPage: response.data.previous !== null,
          totalEvents: response.data.count
        })
        // this.state.getLocationFromEvents()
        this.setState({loading: false})
        window.scrollTo({
          'behavior': 'smooth',
          'top': 0,
          'speed': 50,
        })
      })
      .catch(error=> {
        this.setState({loading: false})
        console.log(error)
      })

    let locationParams = queryParams
    locationParams.place_name = this.state.placeName || undefined
    locationParams = queryString.stringify(locationParams)
    // window.history.pushState({}, "", `/events?${locationParams}`)
    // this.props.history.push(`/plain?${locationParams}`)
    this.setState({shareUrl: `${window.location.host}/plain?${locationParams}`})
    // <Redirect to={`/events?${locationParams}`} />
  }

  onDatetimeChange(variable, e) {
    const obj = {}
    // Round to the nearest hour to prevent cache busting by unique timestamps
    obj[variable] = moment(e._d).startOf('hour')
    obj.useCustomStartTime = true
    this.setState(obj)
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

  render() {
    const title = this.state.placeName ? `Comedy events near: ${this.state.placeName}` : 'findlivecomedy.com'
    return (
      <div className="plain-events-container">
        <Helmet title={title} />
        <GoogleMapsWrapper
          googleMapURL={`https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAP_KEY}&libraries=geometry,drawing,places`} // libraries=geometry,drawing,places
          loadingElement={<div style={{ height: `100%`, width: `100%` }}></div>}
          containerElement={<div style={{ width: `100%` }} >CONTAINER</div>}
          mapElement={<div style={{ height: `0`, width: `0`}} >MAP</div>}
        >
          <PlainEventSearchControls
            onSearchBoxMounted={this.state.onSearchBoxMounted.bind(this)}
            bounds={this.state.bounds}
            onPlacesChanged={this.state.onPlacesChanged.bind(this)}
            getUserLocation={this.getUserLocation.bind(this)}
            onDatetimeChange={this.onDatetimeChange.bind(this)}
            updateSelect={this.updateSelect.bind(this)}
            startTime={this.state.startTime}
            radius={this.state.radius}
            days={this.state.days}
            ordering={this.state.ordering}
            limit={this.state.limit}
            onSubmit={this.refreshEvents.bind(this)}
            placeName={this.state.placeName}
            customRefs={this.customRefs}
            eventSlug={this.props.match.params.eventSlug}
            shareUrl={this.state.shareUrl}
          />
          <Switch>
            <Route exact path="/plain/" render={()=>
              (<div>
                <PlainEventList events={this.state.events} totalEvents={this.state.totalEvents}/>
                <PageControl
                  hasNextPage={this.state.hasNextPage}
                  hasPreviousPage={this.state.hasPreviousPage}
                  onClick={this.state.onPageChange.bind(this)}
                />
              </div>)}/>
            <Route path="/plain/:eventSlug" render={()=><PlainEventDetail eventSlug={this.props.match.params.eventSlug}/>}/>
          </Switch>
          <div>{this.state.loading ? <LoadingSpinner message={this.state.loadingMessage}/> : null}</div>
        </GoogleMapsWrapper>
      </div>
    )
  }
}

export default PlainEvents
