import React from 'react' // eslint-disable-line no-unused-vars
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom'
import Main from './components/Main'

import './App.css'

import ReactGA from 'react-ga'
// initialize Google Analytics if we have a tracking ID
if (process.env.REACT_APP_GOOGLE_ANALYTICS_ID) {
  ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID)
  ReactGA.pageview(window.location.pathname + window.location.search)
}

const ComedyDirectoryApp = () => (
  <div className="app-container">
    <header>
      <a href="/">Find Live Comedy</a> - <small>Made by <a href="//twitter.com/nuclearYolocst" target="_blank" rel="noopener noreferrer">Santiago Angel</a></small>
    </header>
    <Router>
      <div className="App">
        <Switch>
          <Route path="/events/:eventSlug?" component={Main}/>
          <Route path="/">
            <Redirect to="/events"/>
          </Route>
        </Switch>
      </div>
    </Router>
  </div>
)
export default ComedyDirectoryApp
