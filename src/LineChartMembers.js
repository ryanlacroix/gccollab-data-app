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

import './LineChartMembers.css';

import { Button, Header, Image, Modal } from 'semantic-ui-react'

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
            intervalWord: "Interval",
            open: false
        }
    }

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

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
                        title: "Abonnements au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Quotidiennement",
                        frinterval2: "Mensuellement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        intervalWord: "Intervalle"
                    });
                }
                if (nextProps.interval == 'montly'){
                    this.setState({
                        title: "Abonnements au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Mensuellement",
                        frinterval2: "Quotidiennement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        intervalWord: "Intervalle"
                    });
                }
                else{
                    this.setState({
                        title: "Abonnements au groupe",
                        header2: "Date",
                        header2: "Membres",
                        frinterval: "Quotidiennement",
                        frinterval2: "Mensuellement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
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
        console.log("CDM")
        //if(this.props.URLType != this.props.PrevURLType && (this.props.PrevURLType == 'collab-page' || this.props.PrevURLType == "connex-page")){
            // Needs to be replaced with something. Protects component from issues with swapping betwene connex and collab pages
            this.requestData()
        //}
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
        fileDownloader(csv_data, 'membersOverTime.csv');
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
                                <IconButton tooltip={this.props.language=="EN" ? "Download data as CSV" : "Télécharger les données en format CSV"} style={{padding: 0, height:'40px', width:'40px', marginLeft: '10px'}} onClick={this.downloadCSV}>
                                    <FileFileDownload />
                                </IconButton> 
                                <IconButton onClick={this.open}>
                                    <Help/>
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
                <Modal open={this.state.open} onClose={this.close}>
                    <Modal.Header>{this.props.language == "EN" ? "Help Content" : "Contenu d'aide"}</Modal.Header>
                    <Modal.Content>
                    <Modal.Description>
                        <p style={{fontWeight: "bold"}} className="DownloadQ">{this.props.language == "EN" ? "How do I download the data to use later?" : "Comment puis-je télécharger les données pour les utiliser plus tard?"}</p>
                        <p className = "DownloadA1">{this.props.language == "EN" ? "You can download data by clicking the download button" : "Vous pouvez télécharger des données en cliquant sur le bouton de téléchargement"}</p>
                        <Image src="download.jpg" alt="downwards arrow with line underneath"/>
                        <p className = "DownloadA2">{this.props.language == "EN" ? ". The file will be automatically saved to your Downloads folder." : ". Le fichier sera automatiquement enregistré dans votre dossier Téléchargements."}</p>
                        <p className = "DownloadA3">{this.props.language == "EN" ? "The Downloads folder is usually located on the same drive where Windows is installed (for example, C:\\users\\your name\\downloads). You can move downloads from the Downloads folder to other places on your computer." : "Le dossier Téléchargements se trouve habituellement dans le même lecteur où Windows est installé (p. ex., C:\\Utilisateurs\\votre nom\\Téléchargements). Vous pouvez déplacer les téléchargements du dossier Téléchargements vers d’autres emplacements dans votre ordinateur."}</p>

                        <p style={{fontWeight: "bold"}} className="StrtEndQ">{this.props.language == "EN" ? "How do I change the start and end dates for my data?" : "Comment changer les dates de début et de fin de mes données?"}</p>
                        <p className="StrtEndA1">{this.props.language == "EN" ? "You can change the start and end dates by using the buttons which appear below the green banner that says “GCcollab Group Stats Page” on the left" : "Vous pouvez modifier les dates de début et de fin en utilisant les boutons qui s’affichent sous la bannière verte qui indique « GCcollab Group Stats Page » (page des statistiques de groupe GCcollab) à gauche"}</p>
                        <Image src="datePickers.jpg" alt="2 buttons, the left says the date 3 months ago, the right says today's date"/>
                        <p className="StrtEndA2">{this.props.language == "EN" ? ". The button on the left controls the start date and the button on the right controls the end date. To change the date:" : ". Le bouton à gauche sert à sélectionner la date de début et le bouton à droite, la date de fin. Voici comment modifier la date :"}</p>
                        <ul>
                            <li className="StrtEndA3">{this.props.language == "EN" ? "Click on the date which you would like to change. A calendar will drop down below the button." : "Cliquez sur la date que vous souhaitez modifier. Un calendrier s’affichera sous le bouton."}</li>
                            <li className="StrtEndA4">{this.props.language == "EN" ? "Choose a new date by clicking on it. You can change the month by clicking the arrows to the left and right of the month name." : "Choisissez une nouvelle date en cliquant dessus. Vous pouvez modifier le mois en cliquant sur les flèches à gauche et à droite du nom du mois."}</li>
                        </ul>

                        <p style={{fontWeight: "bold"}} className="pvQ">{this.props.language == "EN" ? "What is group membership?" : "Que sont les adhérents à un groupe?"}</p>
                        <p className="pvA">{this.props.language == "EN" ? "Group membership shows the  number of members of your group over time." : "Les adhérents au groupe indiquent le nombre de membres de votre groupe au fil du temps."}</p>

                        <p style={{fontWeight: "bold"}} className="moreHelpQ">{this.props.language == "EN" ? "Have more questions?" : "Avez-vous d’autres questions?"}</p>
                        <p className="moreHelpA">{this.props.language == "EN" ? "You can contact us by email at donneesGC2data@tbs-sct.gc.ca" : "Vous pouvez nous joindre par courriel à donneesGC2data@tbs-sct.gc.ca"}</p>
                    </Modal.Description>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button onClick={this.close}>{this.props.language == "EN" ? "Close" : "Fermer"}</Button>
                    </Modal.Actions>
                </Modal>
            </Segment>
        );
    }
}

export default LineChartMembers;