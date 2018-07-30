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
import Help from 'material-ui/svg-icons/action/help'

import 'c3/c3.css';

import moment from 'moment';

import { Segment, Loader } from 'semantic-ui-react';

import './LineChart2.css';

import { Button, Header, Image, Modal } from 'semantic-ui-react'

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
            header3: 'Unique views',
            downloadCSVmessage: "Download Data as CSV",
            intervalWord: "Interval",
            loading: "Loading",
            language: "EN",
            pageTime: 0,
            avgTimeMessage: "Average time on page:",
            backupGroupNameEN: "",
            backupGroupNameFR: "",
            open: false
        }
    }

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

    handleIncomingData = (data, data2) => {
        // Handle group name
        function replaceAll(str, find, replace) {
            return str.replace(new RegExp(find, 'g'), replace);
        }
        let backupGroupNameEN = ''
        let backupGroupNameFR = ''
        try {
            backupGroupNameEN = replaceAll(JSON.parse(data.group_name).en, "-", " ");
            backupGroupNameFR = replaceAll(JSON.parse(data.group_name).fr, "-", " ");
        } catch (err) {
            backupGroupNameEN = replaceAll(data.group_name, "-", " ");
            backupGroupNameFR = replaceAll(data.group_name, "-", " ");
        }
        // Deepcopy the data to store for interval changes
        let interval = this.state.interval;
        data['daily'].uniquePageviews = data2['daily'].uniquePageviews
        data['monthly'].uniquePageviews = data2['monthly'].uniquePageviews
        let dataBackup = JSON.parse(JSON.stringify(data));
        
        // Apply final transformations for visualization
        data[interval].pageviews = data[interval].pageviews.map(Number);
        data[interval].pageviews.unshift('pageviews');
        data[interval].dates.unshift('date');

        data[interval].uniquePageviews = data2[interval].uniquePageviews.map(Number);
        data[interval].uniquePageviews.unshift('unique pageviews');

        // Update the state
        this.setState({
            data: {
                x: 'x',
                columns: [data[interval].dates, data[interval].pageviews, data[interval].uniquePageviews],
                xFormat: '%Y%m%d',
            },
            dataBackup: dataBackup,
            loaderClass: 'hidden',
            contentClass: '',
            backupGroupNameEN: backupGroupNameEN,
            backupGroupNameFR: backupGroupNameFR
        });
        this.handleIntervalChange(true, 561651, 'daily');
        this.handleIntervalChange(true, 561651, 'daily');
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
        }).then(viewData => {
            fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'pages',
                    stat: 'uniquePageviews',
                    url: groupURL,
                    start_date: startDate,
                    end_date: endDate
                })
            }).then(response => {
                return response.json();
            }).then(uniqueData => {
                console.log(uniqueData)
                this.handleIncomingData(viewData, uniqueData);
            });
        });
    }

    requestAvgTimeOnPage = (nextProps=null) => {
        if (nextProps) {
            if (nextProps.groupURL == '') return;
            var startDate = nextProps.startDate.format("YYYY-MM-DD");
            var endDate = nextProps.endDate.format("YYYY-MM-DD");
            var groupURL = nextProps.groupURL;
        } else {
            var startDate = this.props.startDate.format("YYYY-MM-DD");
            var endDate = this.props.endDate.format("YYYY-MM-DD");
            var groupURL = this.props.groupURL;
        }
        
        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                type: 'pages',
                stat: 'avgTimeOnPage',
                url: groupURL,
                start_date: startDate,
                end_date: endDate
            })
        }).then(response => {
            return response.json();
        }).then(data => {
            this.setState({
                pageTime: parseFloat(data['avgTime']).toFixed(2)
            });
        });
    }

    // Repopulate graphs both on creation and on time changes
    componentWillReceiveProps(nextProps) {
        if(nextProps.language !== this.props.language){
            if(nextProps.language == 'EN'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        header3: "Unique views",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        avgTimeMessage: "Average time on page:"
                    });
                }
                if (nextProps.interval == 'monthly'){
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        header3: "Unique views",
                        frinterval: "Monthly",
                        frinterval2: "Daily",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        avgTimeMessage: "Average time on page:"
                    });
                }
                else{
                    this.setState({
                        title: "Page Views",
                        header1: "Date",
                        header2: "Views",
                        header3: "Unique views",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval",
                        loading: "Loading",
                        avgTimeMessage: "Average time on page:"
                    });
                }
            }
            if(nextProps.language == 'FR'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Pages consultées",
                        header1: "Date",
                        header2: "Pages consultées",
                        header3: "Consultées uniques",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        avgTimeMessage: "Temps moyen sur la page"
                    });
                }
                if (nextProps.interval == 'montly'){
                    this.setState({
                        title: "Pages consultées",
                        header1: "Date",
                        header2: "Pages consultées",
                        header3: "Consultées uniques",
                        frinterval: "Mensuel",
                        frinterval2: "Quotidien",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        avgTimeMessage: "Temps moyen sur la page:"
                    });
                }
                else{
                    this.setState({
                        title: "Pages consultées",
                        header2: "Date",
                        header2: "Pages consultées",
                        header3: "Consultées uniques",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle",
                        loading: "Chargement",
                        avgTimeMessage: "Temps moyen sur la page:"
                    });
                }
            }
        }
        if (this.props.groupURL !== nextProps.groupURL || this.props.startDate !== nextProps.startDate || this.props.endDate !== nextProps.endDate){
            // Language hasn't changed? This change in props is for a new request.
            this.requestData(nextProps);
            this.requestAvgTimeOnPage(nextProps);
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
        data[value].uniquePageviews = data[value].uniquePageviews.map(Number)
        data[value].pageviews.unshift('pageviews');
        data[value].uniquePageviews.unshift('unique pageviews');
        data[value].dates.unshift('date');

        this.setState({
            interval: value,
            data: {
                x: 'date',
                columns: [data[value].dates, data[value].pageviews, data[value].uniquePageviews],
                xFormat: '%Y%m%d',
            }
        }); // add a then here to check for presence of uniques, append if present with second setState
    }

    // Reformat data to .csv and prompt user for download
    downloadCSV = () => {
        // Shape the data into an acceptable format for parsing
        let overall = [];
        for (var i=0;i<this.state.data.columns[0].length;i++) {
            overall.push([this.state.data.columns[0][i], this.state.data.columns[1][i], this.state.data.columns[2][i]]);
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
                output.push([data[0][i], data[1][i], data[2][i]]);
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

    getGroupName = (lang) => {
        if(this.props.groupNameEN == ""){
            return this.state.backupGroupNameEN
        }
        if(this.props.groupNameEN != "" && lang == "EN"){
            return this.props.groupNameEN
        }
        if(this.props.groupNameFR != "" && lang == "FR"){
            return this.props.groupNameFR
        }
        return this.state.backupGroupNameFR
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
                this.state.data.columns[1].unshift("Page Views")
                this.state.data.columns[2].shift()
                this.state.data.columns[2].unshift("Unique Views")
            }
            if (this.props.language == "FR"){
                this.state.data.columns[1].shift()
                this.state.data.columns[1].unshift("Pages consultées")
                this.state.data.columns[2].shift()
                this.state.data.columns[2].unshift("Consultées uniques")
            }
        }
        catch(err){
            console.log("Nope")
        }
        console.log(this.state.data)
        return (
            <Segment className="ind-content-box" style={{marginTop: '10px', padding: '0 0', display: 'inline-block', width: '98%', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <div className = 'title'> <h2> {this.getGroupName(this.props.language)} </h2> </div>
                <table className="content-box-heading" style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span className='outercsv0 cell-title' style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px', marginbottom:'0px'}}> <h3> {this.state.title} </h3>
                                <IconButton tooltip={this.state.downloadCSVmessage} style={{padding: 0, height:'40px', width:'40px', marginLeft: '10px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                                <IconButton onClick={this.open}>
                                    <Help/>
                                </IconButton>
                            </span>
                        </td>
                        <td>
                            <SelectField className= 'cellName' onChange={this.handleIntervalChange} floatingLabelText={this.state.intervalWord} style={{width: 150, float: 'right'}} value={this.state.interval}>
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
                        color={{pattern: ['#467B8D','#55C0A3']}}
                        tooltip={{grouped: true}}
                    />
                </div>
                <DataTable
                    data={spreadsheetData}
                    id="tablePageviews"
                    className={this.state.contentClass + ' ' + scrollTable}
                    headers={[this.state.header1, this.state.header2, this.state.header3]}
                />
                <h4 className={this.state.contentClass}>{this.state.avgTimeMessage} {this.state.pageTime} seconds </h4>
                <Modal open={this.state.open} onClose={this.close}>
                    <Modal.Header>Select a Photo</Modal.Header>
                    <Modal.Content image>
                    <Image
                        wrapped
                        size='medium'
                        src='https://react.semantic-ui.com/images/avatar/large/rachel.png'
                    />
                    <Modal.Description>
                        <Header>Default Profile Image</Header>
                        <p>We've found the following gravatar image associated with your e-mail address.</p>
                        <p>Is it okay to use this photo?</p>
                    </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={this.close}>Nope</Button>
                    </Modal.Actions>
                </Modal>
            </Segment>
        );
    }
}

export default LineChart2;

// <img src={loader} alt="loading" className={this.state.loaderClass} />