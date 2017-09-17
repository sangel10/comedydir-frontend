import React from 'react'
import PropTypes from 'prop-types'
import axios from 'axios'
import moment from 'moment'
import Datetime from 'react-datetime'

class EventList extends React.Component {
  constructor(props) {
    super(props)
    const start = moment()
    const end = moment().add(24, 'hours')

    this.state = {
      events: [],
      // start_time: null,
      // end_time: null,
      start_time: start,
      end_time: end,
    }
  }

  componentDidMount() {
    this.getEvents()
  }

  componentWillUpdate(nextProps, nextState) {
    if (this.state.start_time !== nextState.start_time ||
        this.state.end_time !== nextState.end_time) {
      this.getEvents()
    }
  }

  getEvents() {
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
    url = `${url}?format=json&start_time=${this.state.start_time.unix()}&end_time=${this.state.end_time.unix()}`
    axios.get(url)
      .then(response =>{
        this.setState({events: response.data.results})
      })
  }


  renderEvents() {
    return this.state.events.map((event)=>{
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


  onChange(variable, e) {
    const obj = {}
    obj[variable] = moment(e._d)
    this.setState(obj)
  }

  render() {
    const events = this.renderEvents()
    return (
      <div className="event-list">
        <h3>Country: {this.props.match.params.country_slug}</h3>
        <h3>Region: {this.props.match.params.region_slug}</h3>
        <h3>City: {this.props.match.params.city_slug}</h3>
        <Datetime
          defaultValue={this.state.start_time}
          onBlur={(e)=>{this.onChange('start_time', e)}}
        />
        <Datetime
          defaultValue={this.state.end_time}
          onBlur={(e)=>{this.onChange('end_time', e)}}
        />
        <h3> Founds {this.state.events.length} EVENTS:</h3>
        {events}
      </div>
    )
  }
}

EventList.propTypes = {
  match: PropTypes.object,
}

export default EventList
