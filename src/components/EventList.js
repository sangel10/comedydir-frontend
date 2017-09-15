import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'

class EventList extends React.Component {
  constructor(props) {
    super(props)
    this.state = {events: []}
  }

  componentDidMount() {
    const {country_slug, region_slug, city_slug} = this.props.match.params
    let baseUrl = 'http://127.0.0.1:8000/events/events/'
    if (country_slug && region_slug && city_slug) {
      baseUrl = `${baseUrl}country/${country_slug}/region/${region_slug}/city/${city_slug}`
    }
    else if (country_slug && region_slug) {
      baseUrl = `${baseUrl}country/${country_slug}/region/${region_slug}`
    }
    else if (country_slug) {
      baseUrl = `${baseUrl}country/${country_slug}`
    }
    const url = `${baseUrl}?format=json`
    axios.get(url)
      .then(response =>{
        console.log('resp', response)
        this.setState({events: response.data.results})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      return (
        <div key={event.facebook_id}>
          <h4>{event.name}</h4>
          <img src={event.image_url} />
          <span>{event.facebook_place.facebook_city}</span>
          <span>{event.facebook_place.facebook_country}</span>
        </div>
      )
    })
  }


  render() {
    const events = this.renderEvents()
    return (
      <div>
        <h3>Country: {this.props.match.params.country_slug}</h3>
        <h3>Region: {this.props.match.params.region_slug}</h3>
        <h3>City: {this.props.match.params.city_slug}</h3>
        <h3> EVENTS: {events} </h3>
      </div>
    )
  }
}

EventList.propTypes = {
  match: PropTypes.object,
}

export default EventList
