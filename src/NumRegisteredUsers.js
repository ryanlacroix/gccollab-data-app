import React, {Component} from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import IconButton from 'material-ui/IconButton';
import DataTable from './DataTable';

import C3Chart from 'react-c3js';
import * as fileDownloader from 'js-file-download';
import * as Papa from 'papaparse'

import loader from './Loading_icon.gif';

//import DownloadButton from './ic_file_download_black_24px.svg'
import FileFileDownload from 'material-ui/svg-icons/file/file-download'

import 'c3/c3.css';

import moment from 'moment';

import './NumRegisteredUsers.css';

class NumRegisteredUsers extends Component {
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
            interval: 'monthly',
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
        }
    }
    
    requestData = (nextProps=null) => {
        
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
        // Create a deep copy of the state
        let state = JSON.parse('{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/110891/gctools-team-private-group-groupe-prive-de-lequipe-des-outilsgc"},"metric":3,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}');
        state.time.startDate = moment(state.time.startDate).format('YYYY-MM-DD');
        state.time.endDate = moment(state.time.endDate).format('YYYY-MM-DD');

        fetch('/getData/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
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
        });
    }

    componentWillReceiveProps (nextProps) {
        this.requestData(nextProps);
    }
    componentDidMount() {
        this.requestData();
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
        let sz = { height: 200, width: 500 };
        let spreadsheetData = this.reformatForSpreadsheet(this.state.data.columns);
        // Check if the table is oversize, if so add a scrollbar
        let scrollTable = '';
        if (this.state.data.columns.length > 0) {
            if (this.state.data.columns[0].length > 20) {
                console.log('oversize table detected.')
                scrollTable = ' scrollTable';
            }
        }
        console.log(this.state.contentClass + scrollTable);
        return (
            <div>
                <table style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> {this.props.title}
                                <IconButton tooltip="Download data as CSV" style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                            </span>
                            
                        </td>
                        <td>
                            <SelectField onChange={this.handleIntervalChange} floatingLabelText="Interval" style={{width: 150, float: 'right'}} value={this.state.interval}>
                                <MenuItem value={'monthly'} primaryText="Monthly" />
                                <MenuItem value={'daily'} primaryText="Daily" />
                            </SelectField>
                        </td>
                    </tr>
                </table>
                <img src={loader} alt="loading" className={this.state.loaderClass} />
                <div className={this.state.contentClass}>
                    <C3Chart data={this.state.data}
                        axis={this.state.axis}
                        size={sz}
                        unloadBeforeLoad={true}
                    />
                </div>
                <DataTable
                    data={spreadsheetData}
                    className={this.state.contentClass + scrollTable}
                    headers={['Date','Views']}
                />
            </div>
        );
    }
}

export default NumRegisteredUsers;