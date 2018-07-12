import React, {Component} from 'react';

import IconButton from 'material-ui/IconButton';
import DataTable from './DataTable';

import C3Chart from 'react-c3js';
import * as fileDownloader from 'js-file-download';
import * as Papa from 'papaparse'

import FileFileDownload from 'material-ui/svg-icons/file/file-download'

import { Loader, Segment, Button } from 'semantic-ui-react';

import 'c3/c3.css';

import './MemberDepChart.css';

import enDict from './dict/en_dict.json'
import frDict from './dict/fr_dict.json'

class MemberDepChart extends Component {
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
            showAll: false,
            title: 'Group Membership',
            header1: 'Date',
            header2: 'Members',
            downloadCSVmessage: "Download Data as CSV",
            contentButton: "Show all content",
            contentButton2: "Show less content",
            deptsfr: [],
            deptsen: [],
            fullfr: {},
            fullen: {}

        }
    }

    validTypeCheck (typeStr) {
         let validTypes = ['file','discussion','event_calendar','groups','blog',
                        'bookmarks','pages',];
        if (validTypes.includes(typeStr)) {
            return typeStr;
        } else {
            return 'unknown'
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
    
    requestData = (nextProps = null) => {
        
        this.setState({loaderClass: ''});
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
        let state = JSON.parse('{"stepIndex":4,"reqType":{"category":1,"filter":"'+ groupURL +'"},"metric":4,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}');

        // Send a request for the data
        fetch('/getData/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        }).then(response => {
            return response.json();
        }).then(data => {
            // Apply final transformations for visualization
            var fixed_data = []
            for (var i=0;i<data.departments.length;i++) {
                fixed_data.push([ data.departments[i], data.members[i] ]);
            }

            // Fix duplicate entries
            //fixed_data = this.fixDuplicateEntries(fixed_data);

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

            console.log("ICCCCCCCCCCIIIIII");

            var deptsfr = this.copy(fixed_data);
            var deptsen = this.copy(fixed_data);
            var fulldatafr = this.copy(fullData);
            var fulldataen = this.copy(fullData);
            console.log(fulldataen);
            console.log(fulldataen[0][0])

            var inversefrDict = {};
            for(var key in frDict){
                inversefrDict[frDict[key]] = key;
            }
            
            var inverseEnDict = {};
            for(var key in enDict){
                inverseEnDict[enDict[key]] = key;
            }

            for(var i = 0; i < fixed_data; i++){
                deptsfr[i][0] = frDict[inverseEnDict[deptsfr[i][0]]];
                if (deptsfr[i][0]===undefined){
                    deptsfr[i][0] = fixed_data[i][0]
                }
            }
            for(var i = 0; i < fulldatafr.length; i++){
                fulldatafr[i][0] = frDict[inverseEnDict[fulldatafr[i][0]]];
                if (fulldatafr[i][0]===undefined){
                    fulldatafr[i][0] = fullData[i][0]
                }
            }
            console.log(deptsfr);
            console.log(fulldatafr);
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
                deptsfr: deptsfr,
                deptsen: deptsen,
                fulldatafr: fulldatafr,
                fulldataen: fulldataen
            });
        });
    }

    copy(o) { //reference https://www.codementor.io/avijitgupta/deep-copying-in-js-7x6q8vh5d
        var output, v, key;
        output = Array.isArray(o) ? [] : {};
        for (key in o) {
            v = o[key];
            output[key] = (typeof v === "object") ? this.copy(v) : v;
        }
        return output;
     }

    componentWillReceiveProps(nextProps) {
        if(nextProps.language !== this.props.language){
            if(nextProps.language == 'EN'){
                this.setState({
                    title: "Group Members by Department",
                    header1: "Department",
                    header2: "Group Members",
                    downloadCSVmessage: "Download Data as CSV",
                    contentButton2: "Show less content",
                    contentButton: "Show all content",
                    data: {
                        columns: this.state.deptsen
                    },
                    fullData: this.state.fulldataen,
                    partialData: this.state.fulldataen.slice(0, 20)
                });
            }
            if(nextProps.language == 'FR'){
                this.setState({
                    title: "Membres du groupe par département",
                    header1: "Département",
                    header2: "Membres du groupe",
                    downloadCSVmessage: "Télécharger les données au format CSV",
                    contentButton2: "Montrer moins de contenu",
                    contentButton: "Montrer tout le contenu",
                    data: {
                        columns: this.state.fulldatafr.slice(0, 20)
                    },
                    fullData: this.state.fulldatafr,
                    partialData: this.state.fulldatafr.slice(0, 20)
                });
            }
        }
        else{
            this.requestData(nextProps);
        }
    }
    componentDidMount() {
        this.setState({loaderClass: '', contentClass: 'hidden'});
    }

    // Reformat data to .csv and prompt user for download
    downloadCSV = () => {
        // Convert data to a CSV string and download file
        //let csv_data = Papa.unparse(this.state.data.columns);// Should be pulling this in same was as hottable below
        let csv_data = Papa.unparse(this.state.showAll? this.state.fullData : this.state.partialData);
        fileDownloader(csv_data, 'data_spreadsheet.csv');
    }

    render() {
        let sz = { height: 240, width: 500 };
        
        // 'Unzip' data into c3 format
        var chartData = ['Department']
        for (var i =0; i < this.state.data.columns.length; i++) {
            chartData.push(this.state.data.columns[i][1]);
        }
        console.log('UNZIPPED');
        console.log(chartData);
        //this.state.data
    
        return (
            <Segment className="ind-content-box" style={{marginTop: '10px', padding:'0 0', display: 'inline-block', width: '98%', align: 'center', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <table style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> {this.state.title}
                                <IconButton tooltip={this.state.downloadCSVmessage} style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
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
                    <Loader style={{}} size='huge' active className={this.state.loaderClass} >Loading</Loader>
                </div>
                <div className={this.state.barChartClass} style={{float: 'left'}}>
                    <C3Chart data={{columns: [chartData], labels: true, type: 'bar'}}
                        tooltip={{
                            grouped: false,
                            format: {
                                name:  (name, ratio, id, index) => {
                                    return this.state.data.columns[index][0];
                                }
                            }
                            }}
                        legend={{show: false}}
                        type="bar"
                        size={sz}
                        unloadBeforeLoad={true}
                        bar={{width: { ratio: 0.9}}}
                        grid={{focus: { show: false}}}
                    />
                </div>
                <div style={{width: '500px', float: 'right'}} >
                    <DataTable data={this.state.showAll ? this.state.fullData : this.state.partialData}
                        className={this.state.dataTableClass}
                        style={{borderBottom: '20px'}}
                        headers={[this.state.header1, this.state.header2]}
                    />
                    <div className={this.state.dataTableClass}>
                    <Button
                        primary={true}
                        onClick={() => {
                            this.setState({
                                showAll: !this.state.showAll
                            });
                        }}
                    > {this.state.showAll ? this.state.contentButton2 : this.state.contentButton} </Button>
                    </div>
                </div>
            </Segment>
        );
    }
}

export default MemberDepChart;