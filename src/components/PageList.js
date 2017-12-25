import React from 'react'
import axios from 'axios'
import queryString from 'query-string'
import _ from 'lodash'
import LoadingSpinner from './LoadingSpinner'

class PageList extends React.Component {

  constructor(props) {
    super(props)
    this.getPages = _.debounce(this.getPages, 1000)
    this.state = {
      loading: false,
      pages: [],
      hasNextPage: null,
      totalEvents: null,
      search: '',
      loadingMessage: 'Searching Facebook pages'
    }
  }

  componentDidMount() {
    this.getPages()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.search !== prevState.search) {
      this.getPages()
    }
  }

  getPages() {
    this.setState({loading: true, loadingMessage: `Find Events Near ${this.state.placeName}`})
    const baseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/events/pages/`
    const queryParams={}
    queryParams.search = this.state.search || undefined
    const params = queryString.stringify(queryParams)
    const url = `${baseUrl}?${params}`
    axios.get(url)
      .then(response =>{
        this.setState({
          pages: response.data.results,
          hasNextPage: response.data.next !== null,
          totalEvents: response.data.count
        })
        // this.state.getLocationFromEvents()
        this.setState({loading: false})
      })
      .catch(error=> {
        this.setState({loading: false})
        console.log(error)
      })

    let locationParams = queryParams
    locationParams.place_name = this.state.placeName || undefined
    locationParams = queryString.stringify(locationParams)
    this.setState({shareUrl: `${window.location.host}/plain?${locationParams}`})
  }

  onChange(event) {
    this.setState({search: event.target.value})
  }

  renderPages() {
    return this.state.pages.map(page =>{
      return (
        <div key={page.facebook_id}>
          <a href={`//facebook.com/${page.facebook_id}`}>{page.name}</a>
        </div>
      )
    })
  }

  render() {
    const pages = this.renderPages()
    return (
      <div>
        These are all the FB pages whose events we track. Please search for yours, if it's not already on the list <a id="add-shows" className="menu-item" href="//www.facebook.com/groups/1814445198866527/">feel free to add it here</a>.
        <input
          type="text"
          value={this.state.search}
          placeholder="Search for FB pages we follow"
          onChange={this.onChange.bind(this)}/>
        <div>{this.state.pages.length ? `${this.state.pages.length} pages found` : "No pages found, try changing your search"}</div>
        <br/>
        {pages}
        <div>{this.state.loading ? <LoadingSpinner message={this.state.loadingMessage}/> : null}</div>
      </div>
    )
  }
}

export default PageList
