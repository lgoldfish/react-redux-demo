import React, { Component } from 'react';
import { connect } from 'react-redux';
import logo from './logo.svg';
import './App.css';
import Increment from "./container/Increment"
class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Hello world</h1>
          <h1>Count: {this.props.count}</h1>    
        </header>
        <p className="App-intro">
        </p>
        <Increment/>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {  count: state.count };
}

export default connect(mapStateToProps)(App);
