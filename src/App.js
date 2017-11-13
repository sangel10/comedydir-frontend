import React from 'react' // eslint-disable-line no-unused-vars
import { BrowserRouter as Router, Route, Link, Redirect, Switch } from 'react-router-dom'
import EventList from './components/EventList'

import './App.css'

const ComedyDirectoryApp = () => (
  <Router>
    <div className="App">
      <ul>
        <li><Link to="/">Home</Link></li>
      </ul>
      <hr/>
      <Switch>
        <Route path="/events/:eventSlug?" component={EventList}/>
        <Route path="/">
          <Redirect to="/events"/>
        </Route>
      </Switch>
    </div>
  </Router>
)
export default ComedyDirectoryApp
