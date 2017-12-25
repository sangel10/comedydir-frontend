import React from 'react'
import axios from 'axios'
import queryString from 'query-string'
import _ from 'lodash'
import ReactPaginate from 'react-paginate'
import LoadingSpinner from './LoadingSpinner'
import PageControl from './PageControl'

class PageList extends React.Component {

  constructor(props) {
    super(props)
    this.getPages = _.debounce(this.getPages, 1000)
    this.state = {
      loading: false,
      pages: [],
      hasNextPage: false,
      hasPreviousPage: false,
      totalPages: null,
      limit: 50,
      page: 1,
      search: '',
      loadingMessage: 'Searching Facebook pages',
      onPageChange(change) {
        this.setState({page: (this.state.page + change)})
      }
    }
  }

  componentDidMount() {
    this.getPages()
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.search !== prevState.search) {
      this.setState({page: 1})
      this.getPages()
    }
    if (this.state.page !== prevState.page) {
      this.getPages()
    }
  }

  getPages() {
    this.setState({loading: true, loadingMessage: `Find Events Near ${this.state.placeName}`})
    const baseUrl = `${process.env.REACT_APP_BACKEND_API_URL}/events/pages/`
    const queryParams={}
    queryParams.search = this.state.search || undefined
    queryParams.page = this.state.page || 1
    const params = queryString.stringify(queryParams)
    const url = `${baseUrl}?${params}`
    axios.get(url)
      .then(response =>{
        this.setState({
          pages: response.data.results,
          hasNextPage: response.data.next !== null,
          hasPreviousPage: response.data.previous !== null,
          totalPages: response.data.count
        })
        // this.state.getLocationFromEvents()
        this.setState({loading: false})
      })
      .catch(error=> {
        this.setState({loading: false})
        console.log(error)
      })
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
        <PageControl
          hasNextPage={this.state.hasNextPage}
          hasPreviousPage={this.state.hasPreviousPage}
          onClick={this.state.onPageChange.bind(this)}
        />
        <div>{this.state.loading ? <LoadingSpinner message={this.state.loadingMessage}/> : null}</div>
      </div>
    )
  }
}

export default PageList
