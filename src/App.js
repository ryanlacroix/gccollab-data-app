import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import 'react-dates/initialize';
// import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
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
    const language = 'EN';
    const initLang = "EN";
    date1.setFullYear(date1.getFullYear() - 1);
    let m1 = moment(date1);
    let m2 = moment(date2);
    // Bind the state setter
    this.setMainState = this.setMainState.bind(this);
    this.setStartDate = this.setStartDate.bind(this);
    this.setGroupUrl = this.setGroupUrl.bind(this);
    this.setURLType = this.setURLType.bind(this);
    this.setLanguage = this.setLanguage.bind(this);
    this.setInitLanguage = this.setInitLanguage.bind(this);

    this.state = {
      // Populate this with stuff from control
      language: 'EN',
      startDate: m1,
      endDate: m2,
      groupURL: '',
      onIntro: true,
      URLType: 'collab-group',
      helpmessage: "Paste the group URL above and set your desired start and end dates to retrieve relevant statistics.",
      initLang: 'EN',
      title: "GCcollab Group Stats Page"
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
  setURLType = (URLType) => {
    this.setState({URLType: URLType});
  }
  setLanguage = (l) => {
    this.setState({language: l});
  }
  setInitLanguage = (l) =>{
    this.setInitLanguage({initLang: l});
  }

  render() {
    return (
      <div className="App" style={{/*backgroundImage: "url(https://gccollab.ca//mod/gc_splash_page_collab/graphics/Peyto_Lake-Banff_NP-Canada.jpg)",*/backgroundColor: '#f9f9f9', height: "100%", maxWidth: '100%', align: "center"}}>
        <div id="lang-toggle">
            <a id="eng-toggle" class="lang" onClick={() => this.state.groupURL == "" ? this.setState({helpmessage: "Paste the group URL above and set your desired start and end dates to retrieve relevant statistics.", initLang: "EN", title: "GCcollab Group Stats Page", language: "EN"}) : this.setState({language: "EN", title: "GCcollab Group Stats Page"})}>en</a> | <a id="fr-toggle" class="lang" onClick={() => this.state.groupURL == "" ? this.setState({initLang: "FR", helpmessage: "Collez l'URL du groupe ci-dessus et choisissez les dates de début et de fin pour récupérer les statistiques pertinentes.", title: "Page des statistiques des groupes GCcollab", language: "FR"}) : this.setState({language: "FR", title:"Page des statistiques des groupes GCcollab"})}>fr</a>
        </div>
        <div style={{height: '15px', width: '1px'}}></div>
        <div style={{maxWidth: '1200px', margin: '0 auto'}}>
        <MuiThemeProvider>
          <Container style={{backgroundColor: '#f3f3f3', borderRadius: '5px'}}>
        <header>
          <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet"/>
        </header>
        <div className="App-intro" style={{align: 'center', boxShadow: '0px -1px 80px -4px rgba(0,0,0,0.31)'}}>
          <div className="title-bar" >
            <h1 style={{fontFamily: "'Rubik', sans-serif", fontSize: '2em', backgroundColor: '#467B8D', color: 'white', borderTopLeftRadius: '5px', borderTopRightRadius: '5px'}}>{this.state.title}</h1>
          </div>
          <Control
            superState={this.state}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
            setMainState={this.setMainState}
            setStartDate={this.setStartDate}
            setEndDate={this.setEndDate}
            setGroupUrl={this.setGroupUrl}
            setURLType={this.setURLType}
            setLanguage ={this.setLanguage}
            setInitLanguage={this.setInitLanguage}
            initLang={this.state.initLang}
            language={this.state.language}
          />
          <div className={this.state.onIntro ? 'hidden' : ''}>
            <Content
              superState={this.state}
              startDate={this.state.startDate}
              endDate={this.state.endDate}
              groupURL={this.state.groupURL}
              URLType={this.state.URLType}
              language={this.state.language}
              initLang={this.state.initLang}
            />
          </div>
          <div className={this.state.onIntro ? '' : 'hidden'} style={{paddingBottom: '10px', fontFamily: "'Nunito Sans', sans-serif"}} id="container2">
            {this.state.helpmessage}
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