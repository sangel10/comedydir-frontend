import React from 'react'
import {Route } from 'react-router-dom'
import EventList from './EventList'
import LocationList from './LocationList'
import PropTypes from 'prop-types'

class Country extends React.Component {

  render() {
    return (
      <div>
        <h2>Country</h2>
        <Route exact path={`${this.props.match.url}`} component={LocationList}/>
        <Route exact path={`${this.props.match.url}/:country_slug`} component={EventList}/>
        <Route exact path={`${this.props.match.url}/:country_slug/region`} component={LocationList}/>
        <Route exact path={`${this.props.match.url}/:country_slug/region/:region_slug`} component={EventList}/>
        <Route exact path={`${this.props.match.url}/:country_slug/region/:region_slug/city`} component={LocationList}/>
        <Route exact path={`${this.props.match.url}/:country_slug/region/:region_slug/city/:city_slug`} component={EventList}/>
      </div>
    )
  }
}

Country.propTypes = {
  match: PropTypes.object,
}

export default Country
