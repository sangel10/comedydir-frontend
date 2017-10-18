import React from 'react'
import { GoogleMap, withGoogleMap, withScriptjs } from 'react-google-maps'
import MarkerClusterer from "react-google-maps/lib/components/addons/MarkerClusterer"
import SearchBox from "react-google-maps/lib/components/places/SearchBox"
import _ from 'lodash'


const GoogleMapsWrapper = withScriptjs(withGoogleMap(props => {
  return <GoogleMap {...props} ref={props.onMapMounted}>{props.children}</GoogleMap>
}))


export default class MapSearch extends React.Component {
  componentWillMount() {
    const refs = {}

    this.setState({
      markers: [],
      onMapMounted: map => {
        this.props.onMapMounted()
        refs.map = map
      },
      onSearchBoxMounted: ref => {
        refs.searchBox = ref
      },
      onBoundsChanged: () => {
        // this.props.onBoundsChanged(refs.map.getBounds(), refs.map.getCenter())
        // console.log(refs.map) // (not a Container, a Map) Map {props: {…}, context: {…}, refs: {…}, updater: {…}, _reactInternalFiber: FiberNode, …}
        this.setState({
          bounds: refs.map.getBounds(),
          center: refs.map.getCenter()
        })
      },
      onCenterChanged: () => {
        // this.props.onBoundsChanged(refs.map.getBounds(), refs.map.getCenter())
        // console.log(refs.map) // (not a Container, a Map) Map {props: {…}, context: {…}, refs: {…}, updater: {…}, _reactInternalFiber: FiberNode, …}
        this.setState({
          bounds: refs.map.getBounds(),
          center: refs.map.getCenter()
        })
      },
      onPlacesChanged: () => {
        const places = refs.searchBox.getPlaces()
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
        this.props.onPlacesChanged(nextCenter)

        this.setState({
          center: nextCenter,
          markers: nextMarkers,
        })
        refs.map.fitBounds(bounds)
      },
    })
  }

  render() {
    return (
      <GoogleMapsWrapper
        googleMapURL="https://maps.googleapis.com/maps/api/js?key=AIzaSyCMh8-5D3mJSXspmJrhSTtt0ToGiA-JLBc&libraries=geometry,drawing,places" // libraries=geometry,drawing,places
        loadingElement={<div style={{ height: `100%` }} />}
        containerElement={<div style={{ height: `100%` }} />}
        mapElement={<div style={{ height: `100%` }} />}
        defaultZoom={12}
        defaultCenter={this.props.defaultCenter}
        onMapMounted={this.state.onMapMounted}
        onBoundsChanged={this.state.onBoundsChanged}
        onCenterChanged={this.props.onCenterChanged}
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
      </GoogleMapsWrapper>
    )
  }
}
