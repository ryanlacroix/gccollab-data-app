import React, {Component} from 'react';
import IconButton from 'material-ui/IconButton';
import DataTable from './DataTable';

import C3Chart from 'react-c3js';
import * as fileDownloader from 'js-file-download';
import * as Papa from 'papaparse'

import FileFileDownload from 'material-ui/svg-icons/file/file-download';

import { Loader, Segment, Button } from 'semantic-ui-react';

import 'c3/c3.css';

import './ContentBarChart.css';

class ContentBarChart extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props);
        this.state = {
            data: {
                columns: [
                ],
                type: 'bar'
            },
            type: 'bar',
            groupName: '',
            fullData: {},
            partialData: {},
            barChartClass: 'hide',
            dataTableClass: 'hide',
            loaderClass: '',
            showAll: false
        }
    }

    validTypeCheck (typeStr) {
         let validTypes = ['file','discussion','event_calendar','groups','blog',
                        'bookmarks','pages',];
        if (validTypes.includes(typeStr)) {
            return typeStr;
        } else {
            // Leaving this out for now/ Testing urls
            //return 'unknown'
            return typeStr;
        }
    }

    fixDuplicateEntries (data) {
        // Expects data in the format [ ['(file) name', 30], ['(file) name2', 20]  ]
        // Detects duplicates and adds their views together.
        let newData = [];
        let seenKeys = [];
        for (var i=0;i<data.length;i++) {
            if (seenKeys.includes(data[i][0])) {
                // Already seen this name, find it in array
                for (var r=0;r<newData.length;r++) {
                    if (newData[r][0] === data[i][0]) {
                        // Found the duplicate. Add this entry's views and skip it!
                        newData[r][1] = newData[r][1] + data[i][1];
                    }
                }
            } else {
                // Have not seen this name
                seenKeys.push(data[i][0]);
                newData.push(data[i]);
            }
        }
        // Fix ordering
        newData.sort((a,b) => {
            return b[1]-a[1];
        });
        return newData
    }
    
    requestData = (nextProps=null) => {
        
        this.setState({loaderClass: '', contentClass: 'hidden'});
        if (nextProps) {
            // Do not send request if no query is present
            if (nextProps.groupURL == '') return;
            var groupURL = nextProps.groupURL;
        } else {
            var groupURL = this.props.groupURL;
        }
        
        // Send a request for the data
        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'topContent',
                url: groupURL
            })
        }).then(response => {
            return response.json();
        }).then(data => {
            // Apply final transformations for visualization
            var fixed_data = []
            for (var i=0;i<data.urls.length;i++) {
                fixed_data.push([ '('+ this.validTypeCheck(data.urls[i]) +') ' + data.titles[i], parseInt(data.pageviews[i])]);
            }

            // Show error message if no group content found
            if (data.urls.length === 0) {
                fixed_data.push(['No content found in group', '0'])
            }

            // Fix duplicate entries
            fixed_data = this.fixDuplicateEntries(fixed_data);

            // Need to create separate data store for table
            // Title | type | pageviews
            let fullData = JSON.parse(JSON.stringify(fixed_data));

            // Truncate the formatted data if too many content pieces found
            // (For visualization)
            if (fixed_data.length > 10) {
                fixed_data = fixed_data.slice(0,20);
            }

            // Determine if group name is an object or not
            let groupName = ''
            try {
                groupName = JSON.parse(data.group_name).en;
            } catch (err) {
                console.log(err);
                groupName = data.group_name;
            }

            // Update the state
            this.setState({
                data: {
                    columns: fixed_data,
                },
                groupName: groupName,
                fullData: fullData,
                partialData: fullData.slice(0,20),
                barChartClass: '',
                dataTableClass: '',
                loaderClass: 'hidden',
                contentClass: ''
            });
            setTimeout(() => {
                console.log("timing outtttt");
                this.setState({
                    showAll: this.state.showAll
                })
                setTimeout(() => {
                    console.log("wneoenwf");
                    this.setState({
                        showAll: this.state.showAll
                    })
                }, 250)
              }, 250);
        });
    }

    componentWillReceiveProps(nextProps) {
        this.requestData(nextProps);
    }
    componentDidMount() {
        this.setState({loaderClass: '', contentClass: 'hidden'});
        //this.requestData();
    }

    // Reformat data to .csv and prompt user for download
    downloadCSV = () => {
        // Convert data to a CSV string and download file
        let csv_data = Papa.unparse(this.state.showAll? this.state.fullData : this.state.partialData);
        fileDownloader(csv_data, 'data_spreadsheet.csv');
    }

    render() {
        // let sz = { height: 240, width: 500 };

        // 'Unzip' data into c3 format
        var chartData = ['Content']
        for (var i =0; i < this.state.data.columns.length; i++) {
            chartData.push(this.state.data.columns[i][1]);
        }
        console.log('UNZIPPED');
        console.log(chartData);

        return (
            <Segment className="ind-content-box" style={{marginTop: '10px',padding:'0 0', display: 'inline-block', width: '98%', align: 'center', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <table style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span className = 'outercsv' style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> {this.props.title}
                                <IconButton className = 'innercsv' tooltip="Download data as CSV" style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                            </span>
                            
                        </td>
                        <td>
                            {this.state.groupName}
                        </td>
                    </tr>
                </table>
                <div>
                    <Loader size='huge' active className={this.state.loaderClass} >Loading</Loader>
                </div>
                <div id = 'chart4' className={this.state.barChartClass} style={{float: 'left'}}>
                    <C3Chart data={{columns: [chartData], labels: true, type: 'bar'}}
                        tooltip={{
                            grouped: false,
                            format: {
                                name: (name, ratio, id, index) => {
                                    return this.state.data.columns[index][0];
                                }
                            }
                        }}
                        className = 'c3chart'
                        legend={{show: false}}
                        type="bar"
                        // size={sz}
                        unloadBeforeLoad={true}
                        bar={{width: { ratio: 0.9}}}
                        grid={{focus: { show: false}}}
                    />
                </div>
                <div id = 'table4' style={{width: '500px', float: 'right'}}>
                    <DataTable data={this.state.showAll ? this.state.fullData : this.state.partialData}
                        className={this.state.contentClass}
                        style={{borderBottom: '20px'}}
                        headers={['Title', 'Views']}
                    />
                    <div className={this.state.dataTableClass}>
                        <Button
                            id = 'showAll'
                            primary={true}
                            onClick={() => {
                                this.setState({
                                    showAll: !this.state.showAll
                                });
                            }}
                        > {this.state.showAll ? 'Show less content' : 'Show all content'} </Button>
                    </div>
                </div>
            </Segment>
        );
    }
}

export default ContentBarChart;