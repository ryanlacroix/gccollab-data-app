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
            loading: "This will take 15 to 30 seconds to load. Thank you for your patience!",
            language: "EN",
            pageTime: 0,
            avgTimeMessage: "Average time on page:",
            backupGroupNameEN: "",
            backupGroupNameFR: "",
            open: false,
            subpage: false,
            guid: 0
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
            var platform = nextProps.urlType;
        } else {
            var startDate = this.props.startDate.format("YYYY-MM-DD");
            var endDate = this.props.endDate.format("YYYY-MM-DD");
            var groupURL = this.props.groupURL;
            var platform = this.props.urlType;
        }
        // Construct JSON object to represent request
        let state = JSON.parse('{"stepIndex":4,"reqType":{"category":1,"filter":"'+ groupURL +'"},"metric":1,"metric2":0,"time":{"startDate":"' + startDate +'","endDate":"' + endDate +'","allTime":true},"errorFlag":false}');
        state.time.startDate = moment(state.time.startDate).format('YYYY-MM-DD');
        state.time.endDate = moment(state.time.endDate).format('YYYY-MM-DD');

        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'is_subpage',
                url: groupURL
            })
        }).then(response => {
            return response.json();
        }).then(data => {
            this.setState({
                subpage: data.subpage,
                guid: data.guid
            });
        })
        // Request group name
        fetch('/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'groups',
                stat: 'groupName',
                url: groupURL
            })
        }).then(response => {
            return response.json();
        }).then(nameData => {
            let names = {};
            try {
                names = JSON.parse(nameData['name']);
            } catch (e) {
                names['en'] = '';
                names['fr'] = '';
            }
            
            // Store the two names in the state
            this.setState({
                backupGroupNameEN: names['en'],
                backupGroupNameFR: names['fr']
            });
        })

        // Request pageview and unique pageview data
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
                end_date: endDate,
                platform: platform
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
                    end_date: endDate,
                    platform: platform
                })
            }).then(response => {
                return response.json();
            }).then(uniqueData => {
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
                        loading: "This will take 15 to 30 seconds to load. Thank you for your patience!",
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
                        loading: "This will take 15 to 30 seconds to load. Thank you for your patience!",
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
                        loading: "This will take 15 to 30 seconds to load. Thank you for your patience!",
                        avgTimeMessage: "Average time on page:"
                    });
                }
            }
            if(nextProps.language == 'FR'){
                if (nextProps.interval == 'daily'){
                    this.setState({
                        title: "Visionnement de la page",
                        header1: "Date",
                        header2: "Vues",
                        header3: "Consultées uniques",
                        frinterval: "Quotidiennement",
                        frinterval2: "Mensuellement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        intervalWord: "Intervalle",
                        loading: "Ceci prendra 15 à 30 secondes à charger. Merci de votre patience !",
                        avgTimeMessage: "Temps moyen sur la page"
                    });
                }
                if (nextProps.interval == 'montly'){
                    this.setState({
                        title: "Visionnement de la page",
                        header1: "Date",
                        header2: "Vues",
                        header3: "Consultées uniques",
                        frinterval: "Mensuellement",
                        frinterval2: "Quotidiennement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        intervalWord: "Intervalle",
                        loading: "Ceci prendra 15 à 30 secondes à charger. Merci de votre patience !",
                        avgTimeMessage: "Temps moyen sur la page:"
                    });
                }
                else{
                    this.setState({
                        title: "Visionnement de la page",
                        header2: "Date",
                        header2: "Vues",
                        header3: "Consultées uniques",
                        frinterval: "Quotidiennement",
                        frinterval2: "Mensuellement",
                        downloadCSVmessage: "Télécharger les données en format CSV",
                        intervalWord: "Intervalle",
                        loading: "Ceci prendra 15 à 30 secondes à charger. Merci de votre patience !",
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
        fileDownloader(csv_data, 'pageAnalytics.csv');
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
                    id="tablePageview"
                    className={this.state.contentClass + ' ' + scrollTable}
                    headers={[this.state.header1, this.state.header2, this.state.header3]}
                />
                <h4 className={this.state.contentClass} id = "avgTime">{this.state.avgTimeMessage} {this.state.pageTime} seconds </h4>
                <div style={{clear: 'both'}}>
                    <Button content='Get main group stats'
                        style={this.state.subpage? {} : {display: 'none'}}
                        onClick={(event, data) => {
                            // need function to generate main page url from subpage
                            this.props.setGroupUrl('https://gccollab.ca/groups/profile/' + String(this.state.guid));
                            this.props.setURLType('collab-group');
                        }}
                    />
                </div>
                <Modal open={this.state.open} onClose={this.close}>
                    <Modal.Header>{this.props.language == "EN" ? "Help Content" : "Contenu d'aide"}</Modal.Header>
                    <Modal.Content>
                    <Modal.Description>
                        <p style={{fontWeight: "bold"}} className="zerosQ">{this.props.language == "EN" ? "Why am I seeing zero page views for my group?" : "Pourquoi est-ce que je vois zéro page vue pour mon groupe?"}</p>
                        <p className="zerosA">{this.props.language == "EN" ? "We only collect statistics after the last name change of a group because changing the name also changes the URL. If you changed the name of your group, you will see zero pages views before the change." : "Nous recueillons des statistiques seulement après le changement de nom d’un groupe, car un changement de nom change également l’URL. Si vous changez le nom de votre groupe, vous verrez zéro page vue avant le changement."}</p>

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

                        <p style={{fontWeight: "bold"}} className="pvQ">{this.props.language == "EN" ? "What are page views?" : "Que sont les pages vues?"}</p>
                        <p className="pvA">{this.props.language == "EN" ? "Page views are the total number of times the URL was loaded. Both reloading the page and navigating to a different page and then returning to the original page count as an addition page view." : "Les pages vues représentent le nombre total de fois que l’URL a été chargée. Le fait de recharger la page et le fait de naviguer vers une page différente, puis de revenir à la page originale comptent comme une vue de page supplémentaire. "}</p>

                        <p style={{fontWeight: "bold"}} className="UniquePVQ">{this.props.language == "EN" ? "What is a unique page view?" : "Qu’est-ce qu’une page vue unique?"}</p>
                        <p className="UniquePVA1">{this.props.language == "EN" ? "Unique page views are the number of sessions during which the specified page was viewed at least once. A unique page view is counted for each page URL + page Title combination." : "Les pages vues uniques désignent le nombre de sessions pendant lesquelles la page en question a été visualisée au moins une fois. Une page vue unique est dénombrée chaque fois que le titre de la page figure dans l’adresse URL"}</p>
                        <p className="UniquePVA2">{this.props.language == "EN" ? "Essentially unique page views are the number of sessions per page. If a user views the same page more than once in a session, this will only count as a single unique page view." : "Essentiellement, les pages vues uniques constituent le nombre de sessions par page. Si un utilisateur fait afficher la même page plus d’une fois au cours d’une session, cela comptera comme une seule page vue unique."}</p>

                        <p style={{fontWeight: "bold"}} className="SessionQ">{this.props.language == "EN" ? "What is a session?" : "Qu’est-ce qu’une session?"}</p>
                        <p className="SessionA1">{this.props.language == "EN" ? "A session is a group of user interactions with your website that take place within a given time frame. User interactions include any action (keypress, mouse click, scrolling etc.) a user makes while on your website. A single session can contain multiple page views, events, or social interactions." : "Une session est un groupe d’interactions des utilisateurs avec votre site Web qui ont lieu dans un délai donné. Les interactions des utilisateurs englobent toute action (touche, clic de souris, défilement, etc.) qu’un utilisateur fait sur votre site Web. Une seule session peut contenir de multiples pages vues, événements ou interactions sociales. "}</p>
                        <p className="SessionA2">{this.props.language == "EN" ? "A session is like a container for the actions a user takes on your site during a certain amount of time. Typically sessions end after half an hour of inactivity." : "Une session est comme un contenant pour les actions qu’un utilisateur entreprend sur votre site pendant un certain temps. Habituellement, les sessions se terminent après une demi-heure d’inactivité."}</p>

                        <p style={{fontWeight: "bold"}} className="AvgQ">{this.props.language == "EN" ? "What is average time on page?" : "Qu’est-ce que le temps moyen passé sur une page?"}</p>
                        <p className="AvgA">{this.props.language == "EN" ? "Average time on page is the average time people spend viewing a single page." : "Le temps moyen passé sur une page est le temps moyen que les gens passent à consulter une seule page."}</p>

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
export default LineChart2;
// <img src={loader} alt="loading" className={this.state.loaderClass} />