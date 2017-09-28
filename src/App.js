import React from 'react' // eslint-disable-line no-unused-vars
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import EventList from './components/EventList'

import './App.css'

const BasicExample = () => (
  <Router>
    <div className="App">
      <ul>
        <li><Link to="/">Home</Link></li>
      </ul>

      <hr/>

      <Route exact path="/" component={EventList}/>
    </div>
  </Router>
)
export default BasicExample
