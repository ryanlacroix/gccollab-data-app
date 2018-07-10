import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
// Refactor these ^ later.

// Result views
import LineChartMembers from './LineChartMembers';
import './LineChartMembers.css';
import ContentBarChart from './ContentBarChart';
import './ContentBarChart.css';
import MemberDepChart from './MemberDepChart';
import './MemberDepChart.css';
import LineChart2 from './LineChart2';
import './LineChart2.css';

import Content from './Content';
import Control from './Control';

import './App.css';

import MainView from './MainView'

import { Container } from 'semantic-ui-react';

import moment from 'moment';

import 'react-dates/initialize';
import 'react-dates/lib/css/_datepicker.css';

class App extends Component {
  constructor (props) {
    super(props);
    // Create temporary time objects
    const date1 = new Date();
    const date2 = new Date();
    //date1.setFullYear(date1.getFullYear() - 1);
    date1.setDate(date1.getDate() - 90);
    let m1 = moment(date1);
    let m2 = moment(date2);
    // Bind the state setter
    this.setMainState = this.setMainState.bind(this);
    this.setStartDate = this.setStartDate.bind(this);
    this.setGroupUrl = this.setGroupUrl.bind(this);

    this.state = {
      // Populate this with stuff from control
      startDate: m1,
      endDate: m2,
      groupURL: '',
      onIntro: true
    }
  }

  getState () {
    return this.state;
  }
  setMainState() {
    return this.setState; 
  }
  setStartDate = (s) => {
    this.setState({startDate: s});
  }
  setEndDate = (s) => {
    this.setState({endDate: s});
  }
  setGroupUrl = (url) => {
    this.setState({
      groupURL: url,
      onIntro: false
    });

  }

  render() {
    return (
      <div className="App" style={{/*backgroundImage: "url(https://gccollab.ca//mod/gc_splash_page_collab/graphics/Peyto_Lake-Banff_NP-Canada.jpg)",*/backgroundColor: '#f9f9f9', height: "100%", maxWidth: '100%', align: "center"}}>
        <div style={{height: '15px', width: '1px'}}></div>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <MuiThemeProvider>
          <Container style={{backgroundColor: '#f3f3f3', borderRadius: '5px'}}>
        <header>
          <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet"/>
        </header>
        <div className="App-intro" style={{align: 'center', boxShadow: '0px -1px 80px -4px rgba(0,0,0,0.31)'}}>
          <div className="title-bar" >
            <h1 style={{fontFamily: 'Helvetica,Arial,sans-serif', textShadow: '2px 2px #555' , backgroundColor: '#46246a', color: 'white', borderTopLeftRadius: '5px', borderTopRightRadius: '5px'}}><strong>GC</strong>collab Group Stats Page</h1>
          </div>
          <Control
            superState={this.state}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            setMainState={this.setMainState}
            setStartDate={this.setStartDate}
            setEndDate={this.setEndDate}
            setGroupUrl={this.setGroupUrl}
          />
          <div className={this.state.onIntro ? 'hidden' : ''}>
            <Content
              superState={this.state}
              startDate={this.state.startDate}
              endDate={this.state.endDate}
              groupURL={this.state.groupURL}
            />
          </div>
          <div className={this.state.onIntro ? '' : 'hidden'} style={{paddingBottom: '10px'}}>
            Paste the group URL above and set your desired start and end dates to retrieve relevant statistics.
          </div>
        </div>
        </Container>
        </MuiThemeProvider>
        </div>
      </div>

    );
  }
}

export default App;