import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'

class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = new Date()
    let end = new Date()
    end = new Date(end.setHours(end.getHours() + 5))

    this.state = {
      events: [],
      start_time: start,
      end_time: end,
    }
  }

  componentDidMount() {
    const {country_slug, region_slug, city_slug} = this.props.match.params
    const baseUrl = 'http://127.0.0.1:8000/events/events/'
    let url
    if (country_slug && region_slug && city_slug) {
      url = `${baseUrl}country/${country_slug}/region/${region_slug}/city/${city_slug}`
    }
    else if (country_slug && region_slug) {
      url = `${baseUrl}country/${country_slug}/region/${region_slug}`
    }
    else if (country_slug) {
      url = `${baseUrl}country/${country_slug}`
    }
    else {
      url = baseUrl
    }
    url = `${url}?format=json&start_time=${this.state.start_time.getTime()}&end_time=${this.state.end_time.getTime()}`
    axios.get(url)
      .then(response =>{
        this.setState({events: response.data.results})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
      console.log('moment', moment(event.start_time).fromNow(), event.start_time)
      return (
        <div key={event.facebook_id}>
          <h4>{event.name}</h4>
          <img src={event.image_url} alt="event art"/>
          <div>{moment(event.start_time).format("dddd, MMMM Do YYYY, h:mm:ss a")}</div>
          <div>{moment(event.start_time).fromNow()}</div>
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
        <Datetime />
        <h3> EVENTS: {events} </h3>
      </div>
    )
  }
}

EventList.propTypes = {
  match: PropTypes.object,
}

export default EventList
