import React from 'react' // eslint-disable-line no-unused-vars
import { BrowserRouter as Router, Route, Redirect, Switch } from 'react-router-dom'
import Main from './components/Main'
import PlainEvents from './components/PlainEvents'
import { slide as Menu } from 'react-burger-menu'

import './App.css'

import ReactGA from 'react-ga'
// initialize Google Analytics if we have a tracking ID
if (process.env.REACT_APP_GOOGLE_ANALYTICS_ID) {
  ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID)
  ReactGA.pageview(window.location.pathname + window.location.search)
}

const ComedyDirectoryApp = () => (
  <div className="app-container" id="app-container">
    <header>
      <a href="/">Find Live Comedy</a><small className="made-by"> - Made by <a href="//twitter.com/nuclearYolocst" target="_blank" rel="noopener noreferrer">Santiago Angel</a></small>
    </header>
    <div className="menu-container">
      <Menu>
        <a id="about" className="menu-item" href="/about">About</a>
        <a id="add-shows" className="menu-item" href="//www.facebook.com/groups/1814445198866527/">Add A Show</a>
        <a id="newsletter" target="_blank" className="menu-item" href="//docs.google.com/forms/d/1Q3yJYQc6uA2NdBBog2RYYj-jAlBi6CnvUnSh9WP3YBg/viewform?edit_requested=true">Get E-mail Notification About Shows Near You</a>
        <a id="support" className="menu-item" href="/support">Support</a>
      </Menu>
    </div>
    <Router>
      <div className="app" id="app">
        <Switch>
          <Route path="/events/:eventSlug?" component={Main}/>
          <Route path="/plain/:eventSlug?" component={PlainEvents}/>
          <Route path="/">
            <Redirect to="/plain"/>
          </Route>
        </Switch>
      </div>
    </Router>
  </div>
)
export default ComedyDirectoryApp
