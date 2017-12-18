import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { Link } from 'react-router-dom'

class PlainEventItem extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      isExpanded: false,
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
      <Link key={this.props.event.name} to={`/plain/${this.props.event.slug}`}>
        <h3>{this.props.event.name}</h3>
        <div>{moment(this.props.event.start_time).format("dddd, MMMM Do YYYY, h:mm a")}</div>
        <div>{this.props.event.facebook_place.facebook_name} {this.props.event.facebook_place.facebook_street}</div>
        {expandUI}
        {!this.state.isExpanded ? null :
          <div>
            <img src={this.props.event.image_url} alt="this.props.event art"/>
            <div>{moment(this.props.event.start_time).format("dddd, MMMM Do YYYY, h:mm a")}</div>
            <span>{this.props.event.facebook_place.facebook_city}, {this.props.event.facebook_place.facebook_country}</span>
            <p>
              {this.props.event.description}
            </p>
          </div>
        }
      </Link>
    )
  }
}

export default PlainEventItem

PlainEventItem.propTypes = {
  event: PropTypes.object.isRequired,
}
