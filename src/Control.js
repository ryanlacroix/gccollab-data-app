import React, { Component } from 'react';

import { Button, Input, Popup } from 'semantic-ui-react';

import './Content.css';
import './Control.css';

import * as moment from 'moment';
import 'moment/locale/fr';
import 'moment/locale/en-ca';

import { DatePickerInput } from 'rc-datepicker';
import 'rc-datepicker/lib/style.css';



class Control extends Component {
    constructor(props) {
        super(props);
        // This should instead be passed down from props
        const date1 = new Date();

        //date1.setFullYear(date1.getFullYear() - 1);
        date1.setDate(date1.getDate() - 90);
        this.state = {
            startDate: null,
            endDate: null,
            focusedInput: null,
            currUrl: '',
            validURL: false,
            showError: false,
            errorMessage: "URLs should be of the format https://gcollab.ca/groups/profile...",
            language: '',
            initLang: '',
            helperMessage: "Paste Group URL here...",
            possibleIncorrectURL: '',
            errorMessageEN: "URLs should be of the format https://gcollab.ca/groups/profile...",
            errorMessageFR: 'Les URL doivent être au format https: //gcollab.ca/groups/profile ...'
        }
    }

    // Used to set the URL type. Currently this supports GCcollab groups or random GCcollab pages
    getURLType = (url) => {
        if (url.indexOf('https://gccollab.ca/groups') === 0)
            return ('collab-group')
        else if (url.indexOf('https://gccollab.ca/') === 0)
            return ('collab-page')
        else if (url.indexOf('https://gcconnex.gc.ca/') === 0)
            console.log("connex-page")
            return ('connex-page')
    }

    // Basic check to make sure the URL is actually a group page
    URLIsValid = (url) => {
        if (url.indexOf('https://gccollab.ca/groups/profile') === 0){ 
            return true;
        }
        else if (url.indexOf('https://gccollab.ca/') === 0) {
            return true;
        }
        else if (url.indexOf('https://gcconnex.gc.ca/') === 0) {
            return true;
        }
        else
            return false;
    }

    URLErrorMessageEN = (url) => {      
        if ((url.indexOf('https://gccollab.ca/') === 0) && !this.URLIsValid(url) ) {
            // URL is from collab, but not a group's main page.
            // In the future relevant stats will be served for whatever content is requested.
            // Right now, provide an error + explanation
            return "This tool currently only supports group stats. Enter a group's main page URL (https://gcollab.gc.ca/groups/profile...)"
        } else if (url.indexOf('https://gcconnex') === 0) {
            return "This tool is currently only available for GCcollab groups."
        } else {
            return "URLs should be of the format https://gcollab.ca/groups/profile...";
        }
    }

    URLErrorMessageFR = (url) => {      
        if ((url.indexOf('https://gccollab.ca/') === 0) && !this.URLIsValid(url) ) {
            // URL is from collab, but not a group's main page.
            // In the future relevant stats will be served for whatever content is requested.
            // Right now, provide an error + explanation
            return "Cet outil autorise uniquement les statistiques de groupe actuellement. Entrez l’URL de la page d’accueil du groupe (https://gcollab.gc.ca/groups/profile...)"
        } else if (url.indexOf('https://gcconnex') === 0) {
            return "Cet outil est uniquement disponible pour les groupes GCcollab pour l’instant."
        } else {
            return "Les URL devraient être dans le format suivant : https://gcollab.ca/groups/profile..."
        }
    }

    checkUserInput = (url, lang) => {
        if (this.URLIsValid(url)) {
            this.setState({ currUrl: this.cleanURL(url), validURL: true, showError: false })
        } else {
            // URL is invalid in some way. Generate an error message
            this.setState({validURL: false, showError: true, errorMessageEN: this.URLErrorMessageEN(url), errorMessageFR: this.URLErrorMessageFR(url)})
        }
    }

    // Removes query string from URLs
    // Still needed: account for accent characters
    cleanURL = (url) => {
        if (url.indexOf('?') != -1)
            url = url.slice(0, url.indexOf('?'));
        return url;
    }

    render() {
        console.log(this.state.groupURL)
        console.log(this.props.groupURL)
        if(this.props.initLang == "EN"){
            moment.locale('en-ca');
        }
        else{
            moment.locale('fr');
        }
        let popupStyle = {
            opacity: this.state.validURL ? "0" : "1"
        }
        return (
            <div className="controlDiv" style={{ height: '50px', width: '95%', margin: '0 auto', marginBottom: '5px', marginTop: '10px' }}>
                <div style={{ float: 'left', display: 'inline', width: '410px', paddingTop: '5px', verticalAlign: 'middle' }}>
                    <span style={{ verticalAlign: 'middle' }}>
                        <DatePickerInput
                            displayFormat='DD/MM/YYYY'
                            returnFormat='YYYY-MM-DD'
                            className='my-react-component'
                            defaultValue={this.props.superState.startDate}
                            placeholder='Start Date'
                            iconClassName='calendar icon'
                            valueLink={{
                                value: this.props.startDate, requestChange: (val) => {
                                    //this.setState({startDate: val});
                                    this.props.setStartDate(moment(val))
                                }
                            }}
                            style={{ width: '200px', float: 'left' }}
                            validationFormat="DD/MM/YYYY"
                            showOnInputClick={true}
                            locale= {this.props.language=="EN" ? "en-ca" : "fr"}
                        />
                        <DatePickerInput
                            displayFormat='DD/MM/YYYY'
                            returnFormat='YYYY-MM-DD'
                            className='my-react-component'
                            defaultValue={this.props.superState.endDate}
                            placeholder='End Date'
                            iconClassName='calendar icon'
                            valueLink={{
                                value: this.props.endDate, requestChange: (val) => {
                                    this.props.setEndDate(moment(val));
                                }
                            }}
                            style={{ width: '200px', float: 'right' }}
                            validationFormat="DD/MM/YYYY"
                            showOnInputClick={true}
                            local = {this.props.language=="EN" ? "en-ca" : "fr"}
                        />
                    </span>
                </div>
                <Input className="searchBar" action={
                    <Popup trigger={
                        <Button content={this.props.language=="EN" ? "Get Stats" : "Obtenir des statistiques"}
                        onClick={
                            (event, data) => {
                                if (this.state.validURL) {
                                    this.props.setGroupUrl(this.state.currUrl);
                                    this.props.setPrevURLType(this.props.URLType)
                                    this.props.setURLType(this.getURLType(this.state.currUrl)); 
                                }
                        }} />
                    } content={this.props.language == "EN" ? this.state.errorMessageEN : this.state.errorMessageFR} 
                    style={popupStyle} />
                }
                    placeholder={this.props.language=="EN" ? "Paste Group URL here..." : "Copiez l’URL du groupe ici : "}
                    style={{ float: 'right', width: '500px' }}
                    error={this.state.showError}
                    onChange={(event, data) => {
                        // Need to check if URL provided is valid
                        this.checkUserInput(data.value);
                    }}
                />
            </div>
        );
    }
}

export default Control;