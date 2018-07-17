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
            showAll: false,
            title: 'Top Group Content',
            header1: 'Title',
            header2: 'Views',
            downloadCSVmessage: "Download Data as CSV",
            contentButton: "Show all content",
            contentButton2: "Show less content",
            fixed_data_fr: {},
            fullDataFR: {},
            fixed_data_en: {},
            fullDataEN: {},
            partialDataEN: {},
            partialDataFR: {}
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

    toFrench (typeStr){
        let validTypes = ['file','discussion','event_calendar','groups','blog',
                        'bookmarks','pages',];
        let validTypesFR = ['fichier','discussion','calendrier des événements','groupes ','blog',
        'signets','pages',];
        for(var i=0; i<validTypes.length; i++){
            if(typeStr == validTypes[i]){
                typeStr = validTypesFR[i];
            }
        }
        return typeStr;
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
            var fixed_data_fr = []
            for (var i=0;i<data.urls.length;i++) {
                fixed_data.push([ '('+ this.validTypeCheck(data.urls[i]) +') ' + data.titles[i], parseInt(data.pageviews[i])]);
            }
    
            for (var i=0;i<data.urls.length;i++) {
                fixed_data_fr.push([ '('+ this.toFrench(this.validTypeCheck(data.urls[i])) +') ' + data.titles[i], parseInt(data.pageviews[i])]);
            }

            // Show error message if no group content found
            if (data.urls.length === 0) {
                fixed_data.push(['No content found in group', '0'])
            }
            if (data.urls.length === 0) {
                fixed_data_fr.push(["Aucun contenu trouvé dans le groupe", '0'])
            }

            // Fix duplicate entries
            fixed_data = this.fixDuplicateEntries(fixed_data);
            fixed_data_fr = this.fixDuplicateEntries(fixed_data_fr);

            

            // Need to create separate data store for table
            // Title | type | pageviews
            let fullData = JSON.parse(JSON.stringify(fixed_data));
            let fullDataFR = JSON.parse(JSON.stringify(fixed_data_fr));
            // Truncate the formatted data if too many content pieces found
            // (For visualization)
            if (fixed_data.length > 10) {
                fixed_data = fixed_data.slice(0,20);
            }
            if (fixed_data_fr.length > 10) {
                fixed_data_fr = fixed_data_fr.slice(0,20);
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
            if(this.props.language == "EN"){
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
                    contentClass: '',
                    fixed_data_fr: fixed_data_fr,
                    fullDataFR: fullDataFR,
                    fixed_data_en: fixed_data,
                    fullDataEN: fullData,
                    partialDataEN: fullData.slice(0,20),
                    partialDataFR: fullDataFR.slice(0,20)
                });
            }
            else{
                this.setState({
                    data: {
                        columns: fixed_data_fr,
                    },
                    groupName: groupName,
                    fullData: fullDataFR,
                    partialData: fullDataFR.slice(0,20),
                    barChartClass: '',
                    dataTableClass: '',
                    loaderClass: 'hidden',
                    contentClass: '',
                    fixed_data_fr: fixed_data_fr,
                    fullDataFR: fullDataFR,
                    fixed_data_en: fixed_data,
                    fullDataEN: fullData,
                    partialDataEN: fullData.slice(0,20),
                    partialDataFR: fullDataFR.slice(0,20)
                });
            }
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
        console.log(this.state.fixed_data_fr);
        console.log(this.state.fullDataFR)
        if(nextProps.language !== this.props.language){
            if(nextProps.language == 'EN'){
                this.setState({
                    data: {
                        columns: this.state.fixed_data_en,
                    },
                    fullData: this.state.fullDataEN,
                    title: "Top Group Content",
                    header1: "Title",
                    header2: "Views",
                    downloadCSVmessage: "Download Data as CSV",
                    contentButton2: "Show less content",
                    contentButton: "Show all content",
                    partialData: this.state.partialDataEN
                });
            }
            if(nextProps.language == 'FR'){
                this.setState({
                    data: {
                        columns: this.state.fixed_data_fr,
                    },
                    fullData: this.state.fullDataFR,
                    title: "Top contenu du groupe",
                    header1: "Titre",
                    header2: "Pages consultées",
                    downloadCSVmessage: "Télécharger les données au format CSV",
                    contentButton2: "Montrer moins de contenu",
                    contentButton: "Montrer tout le contenu",
                    partialData: this.state.partialDataFR
                });
            }
        }
        else{
            this.requestData(nextProps);
        }
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
        console.log(this.state.data)
        console.log(this.state.fullData)
        // let sz = { height: 240, width: 500 };

        // 'Unzip' data into c3 format
        var chartData = ['Content']
        for (var i =0; i < this.state.data.columns.length; i++) {
            chartData.push(this.state.data.columns[i][1]);
        }
        return (
            <Segment className="ind-content-box" style={{marginTop: '10px',padding:'0 0', display: 'inline-block', width: '98%', align: 'center', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <table className="topBar" style={{width: '100%'}}>
                    <tr>
                        <td>
                            <span className = 'outercsv0 cell-title' style={{float: 'left', verticalAlign: 'top', paddingLeft:'15px'}}> <h2> {this.state.title} </h2>
                                <IconButton className = 'innercsv' tooltip={this.state.downloadCSVmessage} style={{padding: 0, height:'40px', width:'40px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                            </span>
                            
                        </td>
                        <td>
                        </td>
                    </tr>
                </table>
                <div>
                    <Loader size='huge' active className={this.state.loaderClass} >{this.props.initLang=="EN" ? "Loading" : "Chargement"}</Loader>
                </div>
                <div id = 'chart4' className={this.state.barChartClass} style={{float: 'left'}}>
                    <C3Chart data={{columns: [chartData], labels: true, type: 'bar'}}
                        tooltip={{
                            grouped: false,
                            format: {
                                name: (name, ratio, id, index) => {
                                    return this.state.data.columns[index][0];
                                },
                                title: () => {return 'Content'}
                            }
                        }}
                        className = 'c3chart'
                        legend={{show: false}}
                        type="bar"
                        // size={sz}
                        unloadBeforeLoad={true}
                        bar={{width: { ratio: 0.9}}}
                        grid={{focus: { show: false}}}
                        color={{pattern: ['#467B8D']}}                       
                    />
                </div>
                <div id = 'table4' style={{width: '500px', float: 'right'}}>
                    <DataTable data={this.state.showAll ? this.state.fullData : this.state.partialData}
                        className={this.state.contentClass}
                        style={{borderBottom: '20px'}}
                        headers={[this.state.header1, this.state.header2]}
                    />
                    <div className={this.state.dataTableClass}>
                        <Button
                            id='showAll'
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

export default ContentBarChart;