import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'
import { StandaloneSearchBox } from "react-google-maps/lib/components/places/StandaloneSearchBox"
import DatePicker from 'react-datepicker'
import Select from 'react-select'

class PlainEventSearchControls extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      areAdvancedSearchControlsVisible: false,
      toggleAdvanceSearchControls: () =>{
        this.setState({areAdvancedSearchControlsVisible: !this.state.areAdvancedSearchControlsVisible})
      }
    }
  }

  componentDidUpdate(lastProps) {
    if (lastProps.placeName !== this.props.placeName) {
      // Hack, but if we bind it to the value it won't let us search with autocomplete
      window.document.getElementById('searchbox').value = this.props.placeName
    }
  }

  render() {
    const radiusSelectOptions = [
      { value: 0.5, label: '0.5', clearableValue: false},
      { value: 1, label: '1', clearableValue: false},
      { value: 2, label: '2', clearableValue: false},
      { value: 3, label: '3', clearableValue: false},
      { value: 5, label: '5', clearableValue: false},
      { value: 10, label: '10', clearableValue: false},
      { value: 50, label: '50', clearableValue: false},
      { value: 100, label: '100', clearableValue: false},
      { value: 500, label: '500', clearableValue: false},
      { value: 1000, label: '1000', clearableValue: false},
    ]
    const daysSelectOptions = [
      { value: 1, label: '1', clearableValue: false},
      { value: 2, label: '2', clearableValue: false},
      { value: 3, label: '3', clearableValue: false},
      { value: 7, label: '7', clearableValue: false},
      { value: 14, label: '14', clearableValue: false},
      { value: 30, label: '30', clearableValue: false},
    ]
    const orderingSelectOptions = [
      { value: 'distance_from_target', label: 'Distance', clearableValue: false},
      { value: 'start_time', label: 'Start time', clearableValue: false},
    ]
    const searchOptionsString = (<div className="pointer">Showing comedy events within <span className="underlined">{this.props.radius} km</span> of <span>{this.props.placeName}</span> and starting on <span className="underlined">{moment(this.props.start_time).format("dddd, MMMM Do YYYY, h:mm a")}</span> and spanning <span className="underlined">{this.props.days} days</span>, sorted by <span className="underlined">{this.props.ordering}</span> (change)</div>)
    return (
      <div className="plain-event-search-controls">
        <StandaloneSearchBox
          ref={this.props.onSearchBoxMounted}
          onPlacesChanged={this.props.onPlacesChanged}
        >
          <input
            type="text"
            className="searchbox"
            id="searchbox"
            placeholder="Find Comedy Near..."
          />
        </StandaloneSearchBox>
        <button className="my-location-button"
          onClick={this.props.getUserLocation.bind(this)}>
          Use My Location
        </button>
        <button type="submit" value="search" onClick={this.props.onSubmit.bind(this)}>Refresh</button>
        <a id="newsletter" target="_blank" className="menu-item" href="//docs.google.com/forms/d/1Q3yJYQc6uA2NdBBog2RYYj-jAlBi6CnvUnSh9WP3YBg/viewform?edit_requested=true"><button>Get Notified!</button></a>
        {this.props.eventSlug ? null :
          <h6 onClick={this.state.toggleAdvanceSearchControls} className="pointer">
            {this.state.areAdvancedSearchControlsVisible ? <span className="underlined">Hide Search Options</span> : searchOptionsString }
          </h6>
        }
        {this.state.areAdvancedSearchControlsVisible ?
          <div className="form-fields">
            <label htmlFor="datepicker">Start Date</label>
            <DatePicker
              selected={this.props.startTime}
              id="datepicker"
              onChange={(e)=>{this.props.onDatetimeChange('startTime', e)}}
              showTimeSelect
            />
            <label htmlFor="radius-select">Radius in km</label>
            <Select
              name="radius-select"
              type="number"
              value={this.props.radius}
              options={radiusSelectOptions}
              onChange={(e)=>{this.props.updateSelect('radius', e)}}
            />
            <label htmlFor="days-select">Days</label>
            <Select
              name="days-select"
              type="number"
              value={this.props.days}
              options={daysSelectOptions}
              onChange={(e)=>{this.props.updateSelect('days', e)}}
            />
            <label htmlFor="ordering-select">Order By</label>
            <Select
              name="ordering-select"
              type="number"
              value={this.props.ordering}
              options={orderingSelectOptions}
              onChange={(e)=>{this.props.updateSelect('ordering', e)}}
            />
          </div>
          : null
        }
      </div>
    )
  }
}
export default PlainEventSearchControls

PlainEventSearchControls.propTypes = {
  onSearchBoxMounted: PropTypes.func.isRequired,
  onPlacesChanged: PropTypes.func.isRequired,
  getUserLocation: PropTypes.func.isRequired,
  onDatetimeChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  startTime: PropTypes.object.isRequired,
  radius: PropTypes.number.isRequired,
  updateSelect: PropTypes.func.isRequired,
  days: PropTypes.number.isRequired,
  ordering: PropTypes.string.isRequired,
  placeName: PropTypes.string,
  customRefs: PropTypes.object,
  eventSlug: PropTypes.string,
}
