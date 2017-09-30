import React from 'react'
import { compose } from "recompose"
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker,
} from "react-google-maps"

const GoogleMapWithMarkers = compose(
  withScriptjs,
  withGoogleMap
)(props =>
  <GoogleMap
    defaultZoom={5}
    defaultCenter={{ lat: props.centerLatitude || -34.397,
      lng: props.centerLongitude || 150.644 }}
  >
    {props.events.map(event => (
      <Marker
        key={event.facebook_id}
        position={{ lat: parseInt(event.facebook_place.latitude, 10), lng: parseInt(event.facebook_place.longitude, 10) }}
        title={event.name}
        className="marker"
      />
    ))}
  </GoogleMap>
)

export default GoogleMapWithMarkers

//
// import React from 'react'
// import { compose } from "recompose"
// import {
//   withScriptjs,
//   withGoogleMap,
//   GoogleMap,
//   Marker,
// } from "react-google-maps"
//
// @withScriptjs
// @withGoogleMap
// class GoogleMapWithMarkers extends React.Component {
//   render() {
//     return (
//       <GoogleMap
//         defaultZoom={5}
//         defaultCenter={{ lat: props.centerLatitude || -34.397, lng: props.centerLongitude || 150.644 }}
//       >
//         {props.events.map(event => (
//           <Marker
//             key={event.facebook_id}
//             position={{ lat: parseInt(event.facebook_place.latitude, 10), lng: parseInt(event.facebook_place.longitude, 10) }}
//             title={event.name}
//             className="marker"
//             />
//         ))}
//       </GoogleMap>)
//   }
// }
//
// export default GoogleMapWithMarkers
