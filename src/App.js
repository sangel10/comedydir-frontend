import React from 'react' // eslint-disable-line no-unused-vars
import { BrowserRouter as Router, Route, Link } from 'react-router-dom'
import Home from './components/Home'
import Country from './components/Country'
import './App.css'

const BasicExample = () => (
  <Router>
    <div className="App">
      <ul>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/country">Country</Link></li>
      </ul>

      <hr/>

      <Route exact path="/" component={Home}/>
      <Route path="/country" component={Country}/>

    </div>
  </Router>
)
export default BasicExample
