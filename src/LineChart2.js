import React, {Component} from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import DataTable from './DataTable';

import C3Chart from 'react-c3js';
import * as fileDownloader from 'js-file-download';
import * as Papa from 'papaparse'

//import DownloadButton from './ic_file_download_black_24px.svg'
import FileFileDownload from 'material-ui/svg-icons/file/file-download'

import 'c3/c3.css';

import moment from 'moment';

import { Segment, Loader } from 'semantic-ui-react';

import './LineChart2.css';

class LineChart2 extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            data: {
                x: 'date',
                columns: [
                    //['x', '20130101', '20130102', '20130103', '20130104', '20130105', '20130106'],
                    //['data1', 30, 200, 100, 400, 150, 250]
                    //['x'],
                    //['data1']
                ],
                xFormat: '%Y%m%d', // 'xFormat' can be used as custom format of 'x'
            },
            type: 'timeseries',
            axis: {
                x: {
                    type: 'timeseries',
                    tick: {
                        format: '%Y-%m-%d'
                    }
                }
            },
            interval: 'daily',
            frinterval: 'Daily',
            frinterval2: 'Monthly',
            dataBackup: {
                // This is only here to prevent errors from changing interval before data is loaded
                monthly: {
                    dates: [],
                    pageviews: []
                },
                daily: {
                    dates: [],
                    pageviews: []
                }
            },
            loaderClass: '',
            contentClass: 'hidden',
            title: 'Page Views',
            header1: 'Date',
            header2: 'Views',
            downloadCSVmessage: "Download Data as CSV",
            intervalWord: "Interval",
            loading: "Loading",
            language: "EN",
            groupNameEN: "",
            groupNameFR: "",
            groupName: ""
        }
    }

    // Call this from componentDidMount as well as componentWillReceiveProps
    requestData = (nextProps=null) => {
        
        this.setState({loaderClass: ''});
        // Account for both first and n use of the function
        if (nextProps) {
            // Do not send request if no query is present
            if (nextProps.groupURL == '') return;
            var startDate = nextProps.startDate.format("YYYY-MM-DD");
            var endDate = nextProps.endDate.format("YYYY-MM-DD");
            var groupURL = nextProps.groupURL;
        } else {
            var startDate = this.props.startDate.format("YYYY-MM-DD");
            var endDate = this.props.endDate.format("YYYY-MM-DD");
            var groupURL = this.props.groupURL;
        }
        // Construct JSON object to represent request
        let state = JSON.parse('{"stepIndex":4,"reqType":{"category":1,"filter":"'+ groupURL +'"},"metric":1,"metric2":0,"time":{"startDate":"' + startDate +'","endDate":"' + endDate +'","allTime":true},"errorFlag":false}');
        // 'previous state' issue is coming from here. It's reading the old prop value
        state.time.startDate = moment(state.time.startDate).format('YYYY-MM-DD');
        state.time.endDate = moment(state.time.endDate).format('YYYY-MM-DD');

        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'pageviews',
                url: groupURL,
                start_date: startDate,
                end_date: endDate
            })
        }).then(response => {
            return response.json();
        }).then(data => {
            // Deepcopy the data to store for interval changes
            let dataBackup = JSON.parse(JSON.stringify(data));

            // Apply final transformations for visualization
            data[this.state.interval].pageviews = data[this.state.interval].pageviews.map(Number)
            data[this.state.interval].pageviews.unshift('pageviews');
            data[this.state.interval].dates.unshift('date');

            function replaceAll(str, find, replace) {
                return str.replace(new RegExp(find, 'g'), replace);
            }

            // Determine if group name is an object or not
            let groupNameEN = ''
            let groupNameFR = ''
            try {
                groupNameEN = replaceAll(JSON.parse(data.group_name).en, "-", " ");
                groupNameFR = replaceAll(JSON.parse(data.group_name).fr, "-", " ");
            } catch (err) {
                groupNameEN = replaceAll(data.group_name, "-", " ");
                groupNameFR = replaceAll(data.group_name, "-", " ");
            }

            // Update the state
            if(this.props.language == "EN"){
                this.setState({
                    data: {
                        x: 'x',
                        columns: [data[this.state.interval].dates, data[this.state.interval].pageviews],
                        xFormat: '%Y%m%d',
                    },
                    dataBackup: dataBackup,
                    loaderClass: 'hidden',
                    contentClass: '',
                    groupNameEN: groupNameEN,
                    groupNameFR: groupNameFR,
                    groupName: groupNameEN
                });
            }
            else{
                this.setState({
                    data: {
                        x: 'x',
                        columns: [data[this.state.interval].dates, data[this.state.interval].pageviews],
                        xFormat: '%Y%m%d',
                    },
                    dataBackup: dataBackup,
                    loaderClass: 'hidden',
                    contentClass: '',
                    groupNameEN: groupNameEN,
                    groupNameFR: groupNameFR,
                    groupName: groupNameFR
                });
            }
            this.handleIntervalChange(true, 561651, 'daily');
            this.handleIntervalChange(true, 561651, 'daily');
        });
    }

    // Repopulate graphs both on creation and on time changes
    componentWillReceiveProps(nextProps) {
        console.log("------------------------")
        console.log(this.state.groupNameEN)
        console.log(this.state.groupNameFR)
        console.log(this.props.groupNameEN)
        console.log(this.props.groupNameFR)
        console.log("-----------------------")
        if(nextProps.language !== this.props.language){
            if(nextProps.language == 'EN'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        groupName: this.props.groupNameEN
                    });
                }
                if (nextProps.interval == 'monthly'){
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        frinterval: "Monthly",
                        frinterval2: "Daily",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        groupName: this.props.groupNameEN
                    });
                }
                else{
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        groupName: this.props.groupNameEN
                    });
                }
            }
            if(nextProps.language == 'FR'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Pages consultées",
                        header2: "Date",
                        header2: "Pages consultées",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        groupName: this.props.groupNameFR
                    });
                }
                if (nextProps.interval == 'montly'){
                    this.setState({
                        title: "Pages consultées",
                        header2: "Date",
                        header2: "Pages consultées",
                        frinterval: "Mensuel",
                        frinterval2: "Quotidien",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        groupName: this.props.groupNameFR
                    });
                }
                else{
                    this.setState({
                        title: "Pages consultées",
                        header2: "Date",
                        header2: "Pages consultées",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        groupName: this.props.groupNameFR
                    });
                }
            }
        }
        else{
            this.requestData(nextProps);
        }
    }
    componentDidMount() {
        // Turn on the loading indicator
        this.setState({loaderClass: '',contentClass: 'hidden'});
        //this.requestData();
    }

    handleIntervalChange = (event, index, value) => {
        // Deepcopy the backup data
        let data = JSON.parse(JSON.stringify(this.state.dataBackup));

        // Apply final transformations for visualization
        data[value].pageviews = data[value].pageviews.map(Number)
        data[value].pageviews.unshift('pageviews');
        data[value].dates.unshift('date');

        this.setState({
            interval: value,
            data: {
                x: 'date',
                columns: [data[value].dates, data[value].pageviews],
                xFormat: '%Y%m%d',
            }
        });
    }

    // Reformat data to .csv and prompt user for download
    downloadCSV = () => {
        // Shape the data into an acceptable format for parsing
        let overall = [];
        for (var i=0;i<this.state.data.columns[0].length;i++) {
            overall.push([this.state.data.columns[0][i], this.state.data.columns[1][i]]);
        }
        // Construct the CSV string and start download
        let csv_data = Papa.unparse(overall);
        fileDownloader(csv_data, 'data_spreadsheet.csv');
    }

    reformatForSpreadsheet = (data) => {
        data = JSON.parse(JSON.stringify(data));
        // Only perform changes if data is actually loaded
        if (this.state.data.columns.length > 1) {
            // Improve readability of dates in spreadsheet view
            data[0] = this.fixDates(data[0]);
            let output = [];
            // Reformat dates, skipping column name
            for (var i=0;i<data[0].length;i++) {
                output.push([data[0][i], data[1][i]]);
            }
            output.shift();
            return output;
        } else {
            return data;
        }
    }

    fixDates = (dates) => {
        // Improve readability of dates in spreadsheet view
        let fixDate = (date) => {
            // Make the individual date string a little more readable
            return date.substring(0,4)+'-'+
                date.substring(4,6)+'-'+
                date.substring(6,8);
        }
        let fixedDates = [];
        for (var i=0;i<dates.length;i++) {
            fixedDates.push(fixDate(dates[i]));
        }
        return fixedDates;
    }

    render() {
        // let sz = { height: 240, width: 500 };
        let spreadsheetData = this.reformatForSpreadsheet(this.state.data.columns);
        // Check if the table is oversize, if so add a scrollbar
        let scrollTable = '';
        if (this.state.data.columns.length > 0) {
            if (this.state.data.columns[0].length > 20) {
                scrollTable = ' scrollTable';
            }
        }
        try{
            if (this.props.language == "EN"){
                this.state.data.columns[1].shift()
                this.state.data.columns[1]
                this.state.data.columns[1].unshift("Page Views")
                this.state.data.columns[1]
            }
            if (this.props.language == "FR"){
                this.state.data.columns[1].shift()
                this.state.data.columns[1]
                this.state.data.columns[1].unshift("Pages consultées")
                this.state.data.columns[1]
            }
        }
        catch(err){
            console.log("Nope")
        }
        console.log("------------------------")
        console.log(this.state.groupNameEN)
        console.log(this.state.groupNameFR)
        console.log(this.props.groupNameEN)
        console.log(this.props.groupNameFR)
        console.log("-----------------------")
        return (
            <Segment className="ind-content-box" style={{marginTop: '10px', padding: '0 0', display: 'inline-block', width: '98%', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <div className = 'title'>{this.props.groupNameEN == "" ? this.state.groupName : this.props.language == "EN" ? this.props.groupNameEN : this.props.groupNameFR}</div>
                <table className="content-box-heading" style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span className='outercsv0 cell-title' style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> <h2> {this.state.title} </h2>
                                <IconButton tooltip={this.state.downloadCSVmessage} style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                            </span>
                            
                        </td>
                        <td>
                            <SelectField onChange={this.handleIntervalChange} floatingLabelText={this.state.intervalWord} style={{width: 150, float: 'right'}} value={this.state.interval}>
                                <MenuItem value={'monthly'} primaryText={this.state.frinterval2} />
                                <MenuItem value={'daily'} primaryText={this.state.frinterval} />
                            </SelectField>
                        </td>
                    </tr>
                </table>
                
                <Loader style={{}} size='huge' active className={this.state.loaderClass} >{this.state.loading}</Loader>

                <div className={this.state.contentClass} style={{float: 'left'}} onChange={this.handleIntervalChange} id="lineChartPageviews">
                    <C3Chart data={this.state.data}
                        className='chartss'
                        id="linechartviews"
                        axis={this.state.axis}
                        unloadBeforeLoad={true}
                        point={{show: false}}
                        zoom={{enabled: true}}
                        color={{pattern: ['#467B8D']}}
                    />
                </div>
                <DataTable
                    data={spreadsheetData}
                    id="tablePageviews"
                    className={this.state.contentClass + ' ' + scrollTable}
                    headers={[this.state.header1,this.state.header2]}
                />
            </Segment>
        );
    }
}

export default LineChart2;

// <img src={loader} alt="loading" className={this.state.loaderClass} />