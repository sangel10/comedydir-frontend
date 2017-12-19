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
      <Link key={this.props.event.name} to={`/plain/${this.props.event.slug}`} className="plain-event-item">
        <h3>{this.props.event.name}</h3>
        <div>{moment(this.props.event.start_time).format("h:mma")}</div>
        <div>{moment(this.props.event.start_time).format("dddd, MMMM Do YYYY")}</div>
        <div>{this.props.event.facebook_place.facebook_name}</div>
        <div>{this.props.event.facebook_place.facebook_street}, {this.props.event.facebook_place.facebook_city}</div>
        <div>{Math.round(this.props.event.facebook_place.distance * 10) / 10 } km away</div>
        {expandUI}
        {!this.state.isExpanded ? null :
          <div>
            <img src={this.props.event.image_url} alt="this.props.event art"/>
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
