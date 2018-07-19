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

import './LineChartMembers.css';

class LineChartMembers extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props);
        this.state = {
            data: {
                x: 'date',
                columns: [
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
                    users: []
                },
                daily: {
                    dates: [],
                    users: []
                }
            },
            loaderClass: '',
            contentClass: 'hidden',
            title: 'Group Membership',
            header1: 'Date',
            header2: 'Members',
            downloadCSVmessage: "Download Data as CSV",
            intervalWord: "Interval"
        }
    }

    requestData = (nextProps=null) => {
        
        // Turn on the loading indicator
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

        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'membersOverTime',
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
            data[this.state.interval].users = data[this.state.interval].users.map(Number)
            data[this.state.interval].users.unshift('users');
            data[this.state.interval].dates.unshift('date');
            
            // Update the state
            this.setState({
                data: {
                    x: 'x',
                    columns: [data[this.state.interval].dates, data[this.state.interval].users],
                    xFormat: '%Y%m%d',
                },
                dataBackup: dataBackup,
                loaderClass: 'hidden',
                contentClass: ''
            });
            this.handleIntervalChange(true, 561651, 'daily');
            this.handleIntervalChange(true, 561651, 'daily');
            setTimeout(() => {
                this.setState({
                    showAll: this.state.showAll
                })
                setTimeout(() => {
                    this.setState({
                        showAll: this.state.showAll
                    })
                }, 250)
              }, 250);
        });
    }
    
    componentWillReceiveProps(nextProps) {
        console.log("cwrp")
        if(nextProps.language !== this.props.language){
            if(nextProps.language == 'EN'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Group Membership",
                        header1: "Date",
                        header2: "Members",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval"
                    });
                }
                if (nextProps.interval == 'monthly'){
                    this.setState({
                        title: "Group Membership",
                        header1: "Date",
                        header2: "Members",
                        frinterval: "Monthly",
                        frinterval2: "Daily",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval"
                    });
                }
                else{
                    this.setState({
                        title: "Group Membership",
                        header1: "Date",
                        header2: "Members",
                        frinterval: "Daily",
                        frinterval2: "Monthly",
                        downloadCSVmessage: "Download Data as CSV",
                        intervalWord: "Interval"
                    });
                }
            }
            if(nextProps.language == 'FR'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Appartenance au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle"
                    });
                }
                if (nextProps.interval == 'montly'){
                    this.setState({
                        title: "Appartenance au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Mensuel",
                        frinterval2: "Quotidien",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle"
                    });
                }
                else{
                    this.setState({
                        title: "Appartenance au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Quotidien",
                        frinterval2: "Mensuel",
                        downloadCSVmessage: "Télécharger les données au format CSV",
                        intervalWord: "Intervalle"
                    });
                }
            }
        }
        if(this.props.groupURL !== nextProps.groupURL || this.props.startDate !== nextProps.startDate || this.props.endDate !== nextProps.endDate){
            this.requestData(nextProps);
        }
    }

    componentDidMount() {
        // Turn on the loading indicator
        this.setState({loaderClass: '', contentClass:'hidden'});
    }

    handleIntervalChange = (event, index, value) => {
        // Deepcopy the backup data
        let data = JSON.parse(JSON.stringify(this.state.dataBackup));

        // Apply final transformations for visualization
        data[value].users = data[value].users.map(Number)
        data[value].users.unshift('users');
        data[value].dates.unshift('date');

        this.setState({
            interval: value,
            data: {
                x: 'date',
                columns: [data[value].dates, data[value].users],
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
                this.state.data.columns[1].unshift("Members")
                this.state.data.columns[1]
            }
            if (this.props.language == "FR"){
                this.state.data.columns[1].shift()
                this.state.data.columns[1]
                this.state.data.columns[1].unshift("Membres")
                this.state.data.columns[1]
            }
        }
        catch(err){
            console.log("Nope")
        }
        return (
            <Segment className="ind-content-box" style={{marginTop: '10px', padding: '0 0', display: 'inline-block', width: '98%', align: 'center', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <table style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span className = 'outercsv0 cell-title' style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> <h3> {this.state.title} </h3>
                                <IconButton tooltip={this.props.language=="EN" ? "Download data as CSV" : "Télécharger les données au format CSV"} style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
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
                <div>
                    <Loader size='huge' active className={this.state.loaderClass} >{this.props.language=="EN" ? "Loading" : "Chargement"}</Loader>
                </div>
                <div className={this.state.contentClass} style={{float: 'left'}} id="lineChartMembers">
                    <C3Chart data={this.state.data}
                        axis={this.state.axis}
                        className='chartsss'
                        unloadBeforeLoad={true}
                        zoom={{enabled: true}}
                        point={{show: false}}
                        color={{pattern: ['#467B8D']}}                        
                    />
                </div>
                <DataTable
                    data={spreadsheetData}
                    className={this.state.contentClass + scrollTable}
                    headers={[this.state.header1,this.state.header2]}
                />
            </Segment>
        );
    }
}

export default LineChartMembers;