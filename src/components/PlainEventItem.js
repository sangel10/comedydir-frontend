import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Link } from 'react-router-dom'

class PlainEventItem extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isExpanded: this.props.isExpanded,
      toggleExpanded: (e)=>{
        e.preventDefault()
        this.setState({isExpanded: !this.state.isExpanded})
      }
    }
  }

  goToEventDetail() {
    this.props.history.push(`/plain/${this.props.event.slug}`)
  }


  render() {
    const expandUI = <button onClick={(e)=>{this.state.toggleExpanded(e)}}>{this.state.isExpanded ? `-` : `+`}</button>
    return (
      <div className="plain-event-item">
        <Link key={this.props.event.name} to={`/plain/${this.props.event.slug}`}><h3>{this.props.event.name}</h3></Link>
        <div>{moment(this.props.event.start_time).format("h:mma")}</div>
        <div>{moment(this.props.event.start_time).format("dddd, MMMM Do YYYY")}</div>
        <div>
          <a target="_blank" href={`//www.google.com/maps/search/?api=1&query="${this.props.event.facebook_place.facebook_name} ${this.props.event.facebook_place.facebook_street} ${this.props.event.facebook_place.facebook_city} ${this.props.event.facebook_place.facebook_country}"`}>
            <div>{this.props.event.facebook_place.facebook_name}</div>
            {this.props.event.facebook_place.facebook_street}, {this.props.event.facebook_place.facebook_city}
          </a>
        </div>
        <div>{Math.round(this.props.event.facebook_place.distance * 10) / 10 } km away</div>
        {expandUI}
        {!this.state.isExpanded ? null :
          <div>
            <img src={this.props.event.image_url} alt="this.props.event art"/>
            <p>
              {this.props.event.description}
            </p>
            {this.props.event.facebook_id ? <a target="_blank" href={`//facebook.com/${this.props.event.facebook_id}`}>See event on Facebook</a> : null}
          </div>
        }
      </div>
    )
  }
}

export default PlainEventItem

PlainEventItem.propTypes = {
  event: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
}
