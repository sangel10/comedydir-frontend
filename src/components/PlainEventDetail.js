import React from 'react'
import PropTypes from 'prop-types'
import PlainEventItem from './PlainEventItem'
import axios from 'axios'

class Detail extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      event: null
    }
  }

  componentDidMount() {
    this.getEvent(this.props.eventSlug)
  }

  getEvent(slug) {
    const eventId = slug.split('-')[0]
    const url = `${process.env.REACT_APP_BACKEND_API_URL}/events/events/${eventId}`
    this.setState({loadingEvents: true})
    axios.get(url)
      .then(response =>{
        this.setState({
          event: response.data,
        })
      })
  }


  render() {
    return (
      <div>
        {this.state.event ? <PlainEventItem event={this.state.event} isExpanded={true}/> : null }
      </div>
    )
  }
}

export default Detail

Detail.propTypes = {
  eventSlug: PropTypes.string.isRequired,
}
