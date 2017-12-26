import React from 'react'
import axios from 'axios'
import queryString from 'query-string'

class CitiesIndex extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      locations: [],
      loading: false,
    }
  }

  componentDidMount() {
    this.getIndex()
  }

  getIndex() {
    const url = `${process.env.REACT_APP_BACKEND_API_URL}/events/cities-index/`
    this.setState({loading: true})
    axios.get(url)
      .then(response =>{
        this.setState({
          locations: response.data.data,
        })
      })
  }

  renderLinks() {
    if (!this.state.locations || !this.state.locations.length) {
      return null
    }
    return this.state.locations.map((location)=>{
      const params = {}
      const title = `${location.city}, ${location.region}, ${location.country}`
      params.title = title
      params.latitude = location.latitude
      params.longitude = location.longitude
      params.radius = 50
      params.days = 30
      const queryParams = queryString.stringify(params)
      const url = `/plain?${queryParams}`
      return <div key={title}><a href={url}>{title}</a></div>
    })
  }


  render() {
    const links = this.renderLinks()
    return (
      <div>
        {links}
      </div>
    )
  }
}

export default CitiesIndex
