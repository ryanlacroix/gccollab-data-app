import React, {Component} from 'react';

import IconButton from 'material-ui/IconButton';
import DataTable from './DataTable';

import C3Chart from 'react-c3js';
import * as fileDownloader from 'js-file-download';
import * as Papa from 'papaparse'

import FileFileDownload from 'material-ui/svg-icons/file/file-download'
import Help from 'material-ui/svg-icons/action/help'

import { Loader, Segment, Button } from 'semantic-ui-react';

import 'c3/c3.css';

import './MemberDepChart.css';

import enDict from './en_dict.json'
import frDict from './fr_dict.json'

import {Header, Image, Modal } from 'semantic-ui-react'

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
            title: 'Group Members By Institution',
            header1: 'Department',
            header2: 'Members',
            downloadCSVmessage: "Download Data as CSV",
            contentButton: "Show all content",
            contentButton2: "Show less content",
            deptsfr: [],
            deptsen: [],
            fullfr: {},
            fullen: {},
            open: false
        }
    }

    open = () => this.setState({ open: true });
    close = () => this.setState({ open: false });

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
        
        // Send a request for the data
        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'membersByDepartment',
                url: groupURL,
                start_date: startDate,
                end_date: endDate
            })
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
                groupName = data.group_name;
            }
            var deptsfr = this.copy(fixed_data);
            var deptsen = this.copy(fixed_data);
            var fulldatafr = this.copy(fullData);
            var fulldataen = this.copy(fullData);

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
                    deptsfr: deptsfr,
                    deptsen: deptsen,
                    fulldatafr: fulldatafr,
                    fulldataen: fulldataen
                });
            }
            else{
                this.setState({
                    data: {
                        columns: fulldatafr.slice(0, 20),
                    },
                    groupName: groupName,
                    fullData: fulldatafr,
                    partialData: fulldatafr.slice(0,20),
                    barChartClass: '',
                    dataTableClass: '',
                    loaderClass: 'hidden',
                    deptsfr: deptsfr,
                    deptsen: deptsen,
                    fulldatafr: fulldatafr,
                    fulldataen: fulldataen
                });
            }
            this.setState({
                showAll: this.state.showAll
            });
            this.setState({
                showAll: this.state.showAll
            });
            setTimeout(() => {
                this.setState({
                    showAll: this.state.showAll
                })
                setTimeout(() => {
                    this.setState({
                        showAll: this.state.showAll
                    })
                }, 300)
              }, 300);
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
                try{
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
                catch(err){
                    this.setState({
                        title: "Group Members by Department",
                        header1: "Department",
                        header2: "Group Members",
                        downloadCSVmessage: "Download Data as CSV",
                        contentButton2: "Show less content",
                        contentButton: "Show all content"
                    });
                }
            }     
            if(nextProps.language == 'FR'){
                try{
                    this.setState({
                        title: "Membres du groupe par ministère",
                        header1: "Ministère",
                        header2: "Membres du groupe",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        contentButton2: "Montrer moins de contenu",
                        contentButton: "Montrer tout le contenu",
                        data: {
                            columns: this.state.fulldatafr.slice(0, 20)
                        },
                        fullData: this.state.fulldatafr,
                        partialData: this.state.fulldatafr.slice(0, 20)
                    });
                }
                catch(err){
                    this.setState({
                        title: "Membres du groupe par ministère",
                        header1: "Ministère",
                        header2: "Membres du groupe",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        contentButton2: "Montrer moins de contenu",
                        contentButton: "Montrer tout le contenu",
                    });
                }
            }
        }
        if(this.props.groupURL != nextProps.groupURL){
            this.requestData(nextProps);
        }
    }
    componentDidMount() {
        console.log('memberdepchart mounted')
        //if(this.props.URLType != this.props.PrevURLType && (this.props.PrevURLType == 'collab-page' || this.props.PrevURLType == "connex-page")){
            // Needs to be replaced with something. Protects component from issues with swapping betwene connex and collab pages
            console.log('requesting data in memberdepchart');
            this.requestData()
        //}
        this.setState({loaderClass: '', contentClass: 'hidden'});
    }

    // Reformat data to .csv and prompt user for download
    downloadCSV = () => {
        // Convert data to a CSV string and download file
        //let csv_data = Papa.unparse(this.state.data.columns);// Should be pulling this in same was as hottable below
        let csv_data = Papa.unparse(this.state.showAll? this.state.fullData : this.state.partialData);
        fileDownloader(csv_data, 'membersByDepartment.csv');
    }

    render() {
        // let sz = { height: 200, width: 500 };
        
        // 'Unzip' data into c3 format
        var chartData = ['Department']
        for (var i =0; i < this.state.data.columns.length; i++) {
            chartData.push(this.state.data.columns[i][1]);
        }
        //this.state.data
    
        return (
            <Segment className="ind-content-box" id="memberBox" style={{marginTop: '10px', padding:'0 0', display: 'inline-block', width: '98%', align: 'center', borderRadius: '5px', backgroundColor: '#f9f9f9', border: '2px solid lightgray'}}>
                <table className = 'topBar' style={{width: '100%'}}>
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
                            {this.state.groupName}
                        </td>
                    </tr>
                </table>
                <div>
                    <Loader style={{}} size='huge' active className={this.state.loaderClass} >{this.props.initLang=="EN" ? "Loading" : "Chargement"}</Loader>
                </div>
                <div id = 'chart3' className={this.state.barChartClass} style={{float: 'left'}}>
                    <C3Chart data={{columns: [chartData], labels: true, type: 'bar'}}
                        tooltip={{
                            grouped: false,
                            format: {
                                name:  (name, ratio, id, index) => {
                                    return this.state.data.columns[index][0];
                                },
                                title: () => {return this.props.language == "EN" ? "Department" : "Ministère"}
                            }
                            }}
                        legend={{show: false}}
                        type="bar"
                        className = 'c3chart'
                        // size={sz}
                        unloadBeforeLoad={true}
                        bar={{width: { ratio: 0.9}}}
                        grid={{focus: { show: false}}}
                        color={{pattern: ['#467B8D']}}                        
                    />
                </div>
                <div id = 'table3' style={{width: '500px', float: 'right'}} >
                    <DataTable data={this.state.showAll ? this.state.fullData : this.state.partialData}
                        className={this.state.dataTableClass}
                        style={{borderBottom: '20px'}}
                        headers={[this.state.header1, this.state.header2]}
                    />
                    <div className={this.state.dataTableClass}>
                    <Button
                        id = 'showAllg3'
                        primary={true}
                        onClick={() => {
                            this.setState({
                                showAll: !this.state.showAll
                            });
                        }}
                    > {this.state.showAll ? this.state.contentButton2 : this.state.contentButton} </Button>
                    </div>
                </div>
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

                        <p style={{fontWeight: "bold"}} className="pvQ">{this.props.language == "EN" ? "Why didn’t the graph change when I pushed the ‘Show All Content’ button?" : "Pourquoi le graphique n’a-t-il pas changé lorsque j’ai appuyé sur le bouton « Afficher tout le contenu »?"}</p>
                        <p className="pvA">{this.props.language == "EN" ? "The graph becomes cluttered and hard to read when all of the content is displayed. All of the additional content can be seen in the table, which you can see by scrolling down." : "Le graphique devient encombré et difficile à lire lorsque tout le contenu s’affiche. Tout le contenu supplémentaire se trouve dans le tableau, que vous pouvez voir en faisant défiler vers le bas."}</p>

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

export default MemberDepChart;