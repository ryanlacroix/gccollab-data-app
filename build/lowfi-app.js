var time1 = 'daily'; //var to store value of monthly/daily dropdown
var time2 = 'daily';

var time;

var chartData1;  //var to store data from the json file
var chartData2;
var avgTimeOnPageResp;
var uniqueViewsResp;

var currentLang = 'EN'; //var to store current language of page


var lineChartViews;
var lineChartMembers;
// $.ajax({
//     dataType: "json",
//     url: 'lineChartData1.json',
//     success: function(data){
//         chartData1 = data;
//         mainLine(1);
//     }
// });

// $.ajax({
//     dataType: "json",
//     url: 'lineChartData2.json',
//     success: function(data){
//         chartData2 = data;
//         mainLine(2);
//     }
// });

var progress1 = false; 
var p2 = false;
var p3 = false;
var p4 = false; 
var p5 = false;
var p6 = false;

// var beforeSend = function(){
//     if (progress1 == true && p2 == true && p3 == true && p4 == true && p5 == true){
//         xmlHttp.abort();
//     }
// }

var menu = document.getElementById("select");
menu.addEventListener("change", helper1);

function helper1(event) {
    if (menu.value == "monthly1"){
        time1 = 'monthly';
    }
    if (menu.value == "daily1"){
        time1 = 'daily';
    }
    mainLine(1, uniqueViewsResp, true);
    mainLine(1, chartData1);
}

var menu2 = document.getElementById("select2");
menu2.addEventListener("change", helper2);

function helper2(event) {
    if (menu2.value == "monthly2"){
        time2 = 'monthly';
        mainLine(2);
    }
    if (menu2.value == "daily2"){
        time2 = 'daily';
        mainLine(2);
    }
}
document.getElementById("DownloadCSVLine1").addEventListener("click", function(){
    if (time1 == 'monthly') {    //time is changed based on the last button clicked
        time = chartData1.monthly;
    }
    else if(time1 == 'daily') {
        time = chartData1.daily;
    }
    downloadCSVLine(time);
});

document.getElementById("DownloadCSVLine2").addEventListener("click", function(){
    if (time2 == 'monthly') {    //time is changed based on the last button clicked
        time = chartData2.monthly;
    }
    else if(time2 == 'daily') {
        time = chartData2.daily;
    }
    downloadCSVLine(time);
});

function swap(dict){
    var ret = {};
    for(var key in dict){
      ret[dict[key]] = key;
    }
    return ret;
}
 
var fr_dict = {};
var fr_list = [];
var inverse_fr_dict = {};
$.getJSON("fr_dict.json", function(result){
    fr_dict = result;
    var values = $.map(fr_dict, function(value,key) {return value});
    var keys = $.map(fr_dict, function(value, key) {return key});
    fr_list = Array(values);
    inverse_fr_dict = swap(fr_dict);
});

var en_dict = {};
var en_list = [];
var inverse_en_dict = {};
$.getJSON("en_dict.json", function(result){
    en_dict = result;
    var values = $.map(en_dict, function(value,key) {return value});
    var keys = $.map(en_dict, function(value, key) {return key});
    en_list = Array(values);
    inverse_en_dict = swap(en_dict);
});

//Returns the bilingual version of the name given
function get_bilingual_name (dept){
    try{
        return fr_dict[inverse_en_dict[String(dept)]]
    }
    catch (err){
        return en_dict[inverse_fr_dict[String(dept)]]
    }
}

function departmentsToFrench (barchartData1){
    var barChartData1FR = $.extend(true, {}, barChartData1);
    for(var i=0; i<barchartData1["departments"].length; i++){
        barChartData1FR["departments"][i] = fr_dict[inverse_en_dict[barChartData1FR["departments"][i]]];
        if (barChartData1FR["departments"][i] === undefined){
            barChartData1FR["departments"][i] = barChartData1["departments"][i];
        }
    }
    return barChartData1FR;
}

function toFrench (typeStr){
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

var groupNameEN;
var groupNameFR;
var hardCopyURLTitle;

function updatedTitle (){
    hardCopyBarChart2 = $.extend(true, {}, barChartData2);
    groupNameEN = JSON.parse(hardCopyBarChart2["group_name"]).en
    groupNameFR = JSON.parse(hardCopyBarChart2["group_name"]).fr
    if (groupNameEN === undefined || groupNameEN == ""){
        groupNameEN = replaceAll(chartData1.group_name, "-", " ")
    }
    if (groupNameFR === undefined || groupNameFR == ""){
        groupNameFR = replaceAll(chartData1.group_name, "-", " ")
    }
    if (currentLang == "EN"){
        try{ //need try catch as user may press language toggle before content returned
            document.getElementById("title").innerHTML=groupNameEN;
        }
        catch(err){
            console.log("languagetitleerror");
        }
    }
    else{ //currentLang FR
        try{
            document.getElementById("title").innerHTML=groupNameFR;
        }
        catch(err){
            console.log("languagetitleerror");
        }
    }
}

$("#eng-toggle").on('click', function(event) {
    currentLang = "EN";
    updatedTitle();
    $.datepicker.setDefaults($.datepicker.regional['en']);
    document.getElementById("h11").innerHTML="<strong>GC</strong>collab Group Stats Page";
    document.getElementById("url-message").innerHTML="Paste the group URL above and set your desired start and end dates to retrieve relevant statistics.";
    document.getElementById("pageViewsTitle").innerHTML="Page Views";
    document.getElementById("downloadCSV").innerHTML="Download data as CSV";
    document.getElementById("month").innerHTML="Monthly";
    document.getElementById("day").innerHTML="Daily";
    document.getElementById("month").innerHTML="Monthly";
    document.getElementById("day").innerHTML="Daily";
    document.getElementById("groupMemebershipTitle").innerHTML="Group Membership";
    document.getElementById("departmentTitle").innerHTML="Group Members by Department";
    document.getElementById("topContentTitle").innerHTML="Top Group Content";
    document.getElementById("getStatss").innerHTML="Get Stats";
    var enHelper = $.extend(true, {}, hardCopybcden);
    document.getElementById("avgTimeOnPage").innerHTML="Average time on page: " + parseFloat(Math.round(avgTimeOnPageResp["avgTime"] * 100)/100).toString() + " seconds" ;
    mainLine(1)
    mainLine(2)
    mainBar(2, 'topContent', enHelper)
    mainBar(1, 'departments', barChartData1);
});

$("#fr-toggle").on('click', function(event) {
    currentLang = "FR";
    updatedTitle();
    $.datepicker.setDefaults($.datepicker.regional['fr']);
    document.getElementById("h11").innerHTML="Page des statistiques des groupes <strong>GC</strong>collab";
    document.getElementById("url-message").innerHTML="Collez l'URL du groupe ci-dessus et choisissez les dates de début et de fin pour récupérer les statistiques pertinentes.";
    document.getElementById("pageViewsTitle").innerHTML="Pages consultées";
    document.getElementById("downloadCSV").innerHTML="Télécharger les données au format CSV";
    document.getElementById("month").innerHTML="Mensuel";
    document.getElementById("day").innerHTML="Quotidien";
    document.getElementById("month2").innerHTML="Mensuel";
    document.getElementById("day2").innerHTML="Quotidien";
    document.getElementById("groupMemebershipTitle").innerHTML="Appartenance au groupe";
    document.getElementById("departmentTitle").innerHTML="Membres du groupe par département";
    document.getElementById("topContentTitle").innerHTML="Top contenu du groupe";
    document.getElementById("getStatss").innerHTML="Obtenir des stats";
    zeroethKey = Object.keys(barChartData1)[0]; //name of first column ie "departments"
    firstKey = Object.keys(barChartData1)[1]; //name of second column ie "members"
    barChartData1[zeroethKey].shift(); //adds "department" to start of department array 
    barChartData1[firstKey].shift();
    frenchDepartments = departmentsToFrench(barChartData1);
    var frHelper = $.extend(true, {}, hardCopybcdfr);
    document.getElementById("avgTimeOnPage").innerHTML="Temps moyen sur la page: " + parseFloat(Math.round(avgTimeOnPageResp["avgTime"] * 100)/100).toString() + " secondes" ;
    mainLine(1)
    mainLine(2)
    mainBar(2, 'topContent', frHelper)
    mainBar(1, 'departments', frenchDepartments);
});

$(function() {
    $.datepicker.regional['fr'] = {clearText: 'Effacer', clearStatus: '',
        closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
        prevText: '<Préc', prevStatus: 'Voir le mois précédent',
        nextText: 'Suiv>', nextStatus: 'Voir le mois suivant',
        currentText: 'Courant', currentStatus: 'Voir le mois courant',
        monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
        monthNamesShort: ['Jan','Fév','Mar','Avr','Mai','Jun',
        'Jul','Aoû','Sep','Oct','Nov','Déc'],
        monthStatus: 'Voir un autre mois', yearStatus: 'Voir un autre année',
        weekHeader: 'Sm', weekStatus: '',
        dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
        dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
        dayNamesMin: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
        dayStatus: 'Utiliser DD comme premier jour de la semaine', dateStatus: 'Choisir le DD, MM d',
        dateFormat: 'dd/mm/yy', firstDay: 0, 
        initStatus: 'Choisir la date', isRTL: false};
    $( "#datepicker1" ).datepicker();
    var d = new Date();
    d.setDate(d.getDate() - 90);
    $( "#datepicker1" ).datepicker("setDate", d);
} );

$(function() {
    $.datepicker.regional['fr'] = {clearText: 'Effacer', clearStatus: '',
        closeText: 'Fermer', closeStatus: 'Fermer sans modifier',
        prevText: '<Préc', prevStatus: 'Voir le mois précédent',
        nextText: 'Suiv>', nextStatus: 'Voir le mois suivant',
        currentText: 'Courant', currentStatus: 'Voir le mois courant',
        monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin',
        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
        monthNamesShort: ['Jan','Fév','Mar','Avr','Mai','Jun',
        'Jul','Aoû','Sep','Oct','Nov','Déc'],
        monthStatus: 'Voir un autre mois', yearStatus: 'Voir un autre année',
        weekHeader: 'Sm', weekStatus: '',
        dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
        dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
        dayNamesMin: ['Di','Lu','Ma','Me','Je','Ve','Sa'],
        dayStatus: 'Utiliser DD comme premier jour de la semaine', dateStatus: 'Choisir le DD, MM d',
        dateFormat: 'dd/mm/yy', firstDay: 0, 
        initStatus: 'Choisir la date', isRTL: false};
    $.datepicker.setDefaults($.datepicker.regional[currentLang.toLowerCase()]);
    $( "#datepicker2" ).datepicker();
    $( "#datepicker2" ).datepicker("setDate", new Date());
} );

var tester; 
var pageViewsDone = false;
var uniqueViewsDone = false;
var TitleColumn3;

function mainLine(num, theData, unique=false) {
    if (time1 == 'monthly' && num==1) {    //time is changed based on the last button clicked
        time = theData.monthly;
    }
    else if(time1 == 'daily' && num==1) {
        time = theData.daily;
    }
    else if (time2 == 'monthly' && num==2) {  
        time = chartData2.monthly;
    }
    else if (time2 == 'daily' && num==2) {
        time = chartData2.daily;
    }
    if (num == 1 && unique == false){
        pageViewsDone = true;
        if(currentLang == "EN"){
            var TitleColumn2 = "Page Views";
        }
        else{
            var TitleColumn2 = "Pages consultées";
        }
    }
    else if(num == 2){
        if(currentLang == "EN"){
            var TitleColumn2 = "Members";
        }
        else{
            var TitleColumn2 = "Membres";
        }
    }
    if(unique == true){
        uniqueViewsDone = true;
        if(currentLang == "EN"){
            TitleColumn3 = "Unique Page Views"
        }
        else{
            TitleColumn3 = "Consultées uniques";
        }
    }
    
    tester = avgTimeOnPageResp;
    if(num == 3){
        if(currentLang == "EN"){
            document.getElementById("avgTimeOnPage").innerHTML="Average time on page: " + parseFloat(Math.round(avgTimeOnPageResp["avgTime"] * 100)/100).toString() + " seconds" ;
        }
        else{
            document.getElementById("avgTimeOnPage").innerHTML="Temps moyen sur la page: " + parseFloat(Math.round(avgTimeOnPageResp["avgTime"] * 100)/100).toString() + " secondes" ;
        }
    }
    
    // x = prepareTableDataLine(time);
    // createTable(x);
    x = prepareTableDataLine(time);
    if(pageViewsDone == true && uniqueViewsDone == true){ //if both the unique and page views have been done
        if(currentLang == "EN"){
            var TitleColumn2 = "Page Views";
        }
        else{
            var TitleColumn2 = "Pages consultées";
        }
        y = uniqueDataPrep(x);
        createTable(y, '#theTable1', "Date", TitleColumn2, TitleColumn3);
        pageViewsDone = false;
        uniqueViewsDone = false;
    }
    else if(unique == true && pageViewsDone == false){
    }
    else{
        createTable(x, '#theTable2', "Date", TitleColumn2);
    }
    // createTable(x, '#theTable'.concat(String(num)), "Date", TitleColumn2);
    createChartLine(time, '#chart'.concat(String(num)));
}

var theLooped;

function uniqueDataPrep(data){
    if(time1 == "daily"){
        theLooped = uniqueViewsResp.daily.uniquePageviews;
    }
    else if(time1 == "monthly"){
        theLooped = uniqueViewsResp.monthly.uniquePageviews;
    }
    console.log("theLooped");
    console.log(theLooped);
    for(var i = 0; i < data.length; i++){
        data[i].push(theLooped[i]);
    }
    return data;
}

function prepareTableDataLine(timeFrame){
    valueKey = Object.keys(timeFrame)[1];
    if(timeFrame.dates[0] == 'Dates'){      //formatting the data to be used for making the table
        timeFrame.dates.splice(0,1);
        timeFrame[valueKey].splice(0,1);
    }
    var dataSet = []
    if(timeFrame.dates[0][4] == '-'){       //check if the dates are formatted
        for(var i =0; i < timeFrame.dates.length; i++){
            dataSet.push(timeFrame.dates[i].split());   //more data formatting
            dataSet[i].push(timeFrame[valueKey][i]);        //^
        }
    }
    else{
        for(var i =0; i < timeFrame.dates.length; i++){
            timeFrame.dates[i] = timeFrame.dates[i].substr(0, 4) + '-' + timeFrame.dates[i].substr(4, 2) + '-' + timeFrame.dates[i].substr(6, 2);
            dataSet.push(timeFrame.dates[i].split());
            dataSet[i].push(timeFrame[valueKey][i]);
        }
    }
    return dataSet;
}

function createTable(tableData, tableID, TitleColumn1, TitleColumn2, Column3=false){
    if(Column3 == "Unique Page Views"){
        if ( $.fn.dataTable.isDataTable( tableID ) ) { //check if this is already a datatable
            $(tableID).DataTable().destroy();              //clear its data
            $(document).ready(function() {
                $(tableID).DataTable( {      //initialization of the datatable
                    data: tableData,
                    // "columnDefs": [
                    //     { "width": "20%", "targets": 0 }
                    // ],
                    columns: [
                        { title: TitleColumn1 },
                        { title: TitleColumn2 },
                        { title: Column3 }
                    ],
                    "scrollY": "200px",     //scroll function and the default size of the table
                    "searching": false,     //disabled the search function
                    "paging":   false,      //disabled paging
                    scrollCollapse: true, //shortens the height of the table if there isnt much data to fill up its height
                    "deferRender": true,    //renders one page at a time to speed up intialization if we're using a paginated table(but we're not lol)
                    "processing": true,     //displays a 'processing' indicator while the table is being processed
                    "bInfo": false,         //the table by default states "show 1 to N entries of N entries" so i got rid of that
                } );
            } );
        }
        else{
            $(document).ready(function() {
                $(tableID).DataTable( {      //initialization of the datatable
                    data: tableData,
                    // "columnDefs": [
                    //     { "width": "20%", "targets": 0 }
                    // ],
                    columns: [
                        { title: TitleColumn1 },
                        { title: TitleColumn2 },
                        { title: Column3 }
                    ],
                    "scrollY": "200px",     //scroll function and the default size of the table
                    "searching": false,     //disabled the search function
                    "paging":   false,      //disabled paging
                    scrollCollapse: true, //shortens the height of the table if there isnt much data to fill up its height
                    "deferRender": true,    //renders one page at a time to speed up intialization if we're using a paginated table(but we're not lol)
                    "processing": true,     //displays a 'processing' indicator while the table is being processed
                    "bInfo": false,         //the table by default states "show 1 to N entries of N entries" so i got rid of that
                } );
            } );
        }
    }
    else{
        if ( $.fn.dataTable.isDataTable( tableID ) ) { //check if this is already a datatable
            $(tableID).DataTable().destroy();              //clear its data
            $(document).ready(function() {
                $(tableID).DataTable( {      //initialization of the datatable
                    data: tableData,
                    // "columnDefs": [
                    //     { "width": "20%", "targets": 0 }
                    // ],
                    columns: [
                        { title: TitleColumn1 },
                        { title: TitleColumn2 },
                    ],
                    "scrollY": "200px",     //scroll function and the default size of the table
                    "searching": false,     //disabled the search function
                    "paging":   false,      //disabled paging
                    scrollCollapse: true, //shortens the height of the table if there isnt much data to fill up its height
                    "deferRender": true,    //renders one page at a time to speed up intialization if we're using a paginated table(but we're not lol)
                    "processing": true,     //displays a 'processing' indicator while the table is being processed
                    "bInfo": false,         //the table by default states "show 1 to N entries of N entries" so i got rid of that
                } );
            } );
        }
        else{
            $(document).ready(function() {
                $(tableID).DataTable( {      //initialization of the datatable
                    data: tableData,
                    // "columnDefs": [
                    //     { "width": "20%", "targets": 0 }
                    // ],
                    columns: [
                        { title: TitleColumn1 },
                        { title: TitleColumn2 },
                    ],
                    "scrollY": "200px",     //scroll function and the default size of the table
                    "searching": false,     //disabled the search function
                    "paging":   false,      //disabled paging
                    scrollCollapse: true, //shortens the height of the table if there isnt much data to fill up its height
                    "deferRender": true,    //renders one page at a time to speed up intialization if we're using a paginated table(but we're not lol)
                    "processing": true,     //displays a 'processing' indicator while the table is being processed
                    "bInfo": false,         //the table by default states "show 1 to N entries of N entries" so i got rid of that
                } );
            } );
        }
    }
}
        
        
function createChartLine(timeFrame, chartID){
    
    var thisTime = JSON.parse(JSON.stringify(timeFrame));
    for(var i =0; i < thisTime.dates.length; i++){
            //thisTime.dates[i] = thisTime.dates[i].substr(0, 4) + '-' + thisTime.dates[i].substr(4, 2) + '-' + thisTime.dates[i].substr(6, 2);
        }
    dateKey = Object.keys(thisTime)[0];      
    thisTime[dateKey].unshift(dateKey); //data formatting to create the chart
    columnss = thisTime.dates;
    valueKey = Object.keys(thisTime)[1];
    thisTime[valueKey].unshift(valueKey);
    dataa = thisTime[valueKey];
    
    //setting tooltips in if else below
    if(chartID == "#chart1"){
        if(currentLang == "EN"){
            if(dataa[0] == "pageviews"){
                dataa[0] = "Page Views";
            }
            else if(dataa[0] == "uniquePageviews"){
                dataa[0] = "Unique Page Views";
            } 
        }
        else{ //lang is french
            if(dataa[0] == "pageviews"){
                dataa[0] = "Pages consultées";
            }
            else if(dataa[0] == "uniquePageviews"){
                dataa[0] = "Consultées uniques";
            } 
        }
    }
    else{ //chart2
        if(currentLang == "EN"){
            dataa[0] = "Members"
        }
        else{ //lang is french
            dataa[0] = "Membres"
        }
    }
    if (dataa[0]=='Page Views' || dataa[0]=='Unique Page Views' || dataa[0]=='Pages consultées' || dataa[0]=='Consultées uniques'){
        lineChartViews.load({
            columns: [
                columnss,
                dataa
            ]
        });  
    }
    else if(dataa[0]=='Members' ||  dataa[0]=='Membres'){
        lineChartMembers.load({
            columns: [
                columnss,
                dataa
            ]
        })
    }
    // if (dataa[0]=='Page Views' || dataa[0]=='uniquePageviews' || dataa[0]=='Pages consultées' || dataa[0]=='pageviews'){
    //     console.log("LOAAAAAAAAAAADDDDDDING");
    //     lineChartViews.load({
    //         columns: [
    //             columnss,
    //             dataa
    //         ]
    //     });  
    // }
    // else if(dataa[0]=='users' || dataa[0]=='Members' || dataa[0]=='Membres'){
    //     lineChartMembers.load({
    //         columns: [
    //             columnss,
    //             dataa
    //         ]
    //     })
    // }
    }

function downloadCSVLine(timeFrame){
    // Shape the data into an acceptable format for parsing
    var thisTime = JSON.parse(JSON.stringify(timeFrame));
    var overall = [];
    valueKey = Object.keys(thisTime)[1];
    dateKey = Object.keys(thisTime)[0];
    thisTime[dateKey].unshift(dateKey); //data formatting to create the chart
    thisTime[valueKey].unshift(valueKey);
    for(var i = 0; i < thisTime[valueKey].length; i++){
        overall.push([thisTime[dateKey][i], thisTime[valueKey][i]]);
    }
    // Construct the CSV string and start download
    var csv_data = Papa.unparse(overall);
    download(csv_data, 'data_spreadsheet.csv');
}


//BARCHART STUFF
var barChartData1;
var barChartData2;
var hardCopybcden;
var hardCopybcdfr; 

//var titles=["Departments", "Members"]; 
//var columnColors = [rgb(31, 119, 180), rgb(255, 127, 14), rgb(44, 160, 44), rgb(214, 39, 40), rgb(148, 103, 189), rgb(140, 86, 75), rgb(227, 119, 194), rgb(127, 127, 127), rgb(188, 189, 34), rgb(23, 190, 207)];
var columnColors = ['#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177', '#047177'];

        
document.getElementById("DownloadCSVBar1").addEventListener("click", function(){
    downloadCSVBar(barChartData1);
});

document.getElementById("DownloadCSVBar2").addEventListener("click", function(){
    downloadCSVBar(barChartData2);
});

// $.ajax({
//     dataType: "json",
//     url: 'barChartData1.json',
//     success: function(d){
//         mainBar(1, 'department', d);
//     }
// });

// $.ajax({
//     dataType: "json",
//     url: 'barChartData2.json',
//     success: function(d){
//         mainBar(2, 'topContent', d)
//     }
// });

function mainBar(num, stringy, barChartData){
    if(stringy == 'departments'){
        x = prepareTableDataBar(barChartData)
    }
    if(num==1){
        if(currentLang == "EN"){
            var TitleColumn1 = "Department";
            var TitleColumn2 = "Members";
        }
        else{
            var TitleColumn1 = "Départment";
            var TitleColumn2 = "Membres du groupe";
        }
    }
    else if(stringy == 'topContent'){
        x = prepareTableDataBar2(barChartData);
    }
    if(num==2){
        if(currentLang == "EN"){
            var TitleColumn1 = "Title";
            var TitleColumn2 = "Views";
        }
        else{
            var TitleColumn1 = "Titre";
            var TitleColumn2 = "Pages consultées";
        }
    }
    createChartBar(barChartData, '#barChart'.concat(String(num)));
    createTable(x, '#test'.concat(String(num)), TitleColumn1, TitleColumn2);
}
        
function prepareTableDataBar(chartData){
    var dataSet = []
    zeroethKey = Object.keys(chartData)[0];
    firstKey = Object.keys(chartData)[1]; 
    for(var i =0; i < chartData[zeroethKey].length; i++){
        dataSet.push(chartData[zeroethKey][i].split());
        dataSet[i].push(chartData[firstKey][i]);
    }
    return dataSet;
}

function createChartBar(chartData, chartID){
    zeroethKey = Object.keys(chartData)[0]; //name of first column ie "departments"
    firstKey = Object.keys(chartData)[1]; //name of second column ie "members"
    chartData[zeroethKey].unshift(zeroethKey); //adds "department" to start of department array 
    chartData[firstKey].unshift(firstKey);
    columnss = chartData[zeroethKey].slice(1,21); 
    dataa = chartData[firstKey].slice(0,21);
    if (firstKey == 'members'){
        if (currentLang == "EN"){
            dataa[0] = "Members"
        }
        else{
            dataa[0] = "Membres"
        }
    }
    if (firstKey == "pageviews"){
        if (currentLang == "EN"){
            dataa[0] = "Views"
        }
        else{
            dataa[0] = "Pages Consultées"
        }
    }
    var str = firstKey;
    var chart = c3.generate({
        bindto: chartID,
        data: {
            columns: [
                dataa,
            ],
            type: 'bar',
            labels: true,
            color: function (color, d) {
                // d will be 'id' when called for legends
                return columnColors[d.index];
            },
        },
        legend: {
            show: false
        },
        bar: {
            width: {
                ratio: 0.9 // this makes bar width 50% of length between ticks
            }
            // or
            //width: 100 // this makes bar width 100px
        },
        axis: {
            x: {
                type: 'category',
                categories: columnss,
            }
        },
        onrendered: function() {
            d3.selectAll(".c3-axis.c3-axis-x .tick text")
                .style("display", "none");
        }
    });
}

function downloadCSVBar(chartData){
    //barChartData.departments.unshift('departments');
    // Shape the data into an acceptable format for parsing
    var overall = [];
    zeroethKey = Object.keys(chartData)[0];
    firstKey = Object.keys(chartData)[1]; 
    for(var i = 0; i < chartData[zeroethKey].length; i++){
        overall.push([chartData[zeroethKey][i], chartData[firstKey][i]]);
    }
    // Construct the CSV string and start download
    var csv_data = Papa.unparse(overall);
    download(csv_data, 'data_spreadsheet.csv');
}

function validTypeCheck (typeStr) {
    validTypes = ['file','discussion','event_calendar','groups','blog',
    'bookmarks','pages', 'docs'];
    if (validTypes.includes(typeStr)) {
        return typeStr;
    } 
    else {
        return 'unknown';
    }
}

function fixDuplicateEntries (data) {
    // Expects data in the format [ ['(file) name', 30], ['(file) name2', 20] ]
    // Detects duplicates and adds their views together.
    newData = [];
    seenKeys = [];
    for (var i=0;i<data.length;i++) {
        if (seenKeys.includes(data[i][0])) {
            // Already seen this name, find it in array
            for (var r=0;r<newData.length;r++) {
                if (newData[r][0] === data[i][0]) {
                    // Found the duplicate. Add this entry's views and skip it!
                    newData[r][1] = newData[r][1] + data[i][1];
                }
            }
        } 
        else {
            // Have not seen this name
            seenKeys.push(data[i][0]);
            newData.push(data[i]);
        }
    }
    // Fix ordering
    newData.sort(function(a,b){
        return a[1] - b[1];
    });
    return newData;
}

function fixDataBarChart2(data){
    zeroethKey = Object.keys(data)[0]; //"fileType"
    //goes through file type array and applies validTypeCheck
    for(var i=0; i<data[zeroethKey].length; i++){ 
        data[zeroethKey][i] = validTypeCheck(data[zeroethKey][i]);
    }
    data = fixDuplicateEntries(data);
    return data;
}

//returns data in format [ ['(file) name', 30], ['(file) name2', 20] ]
function prepareTableDataBar2(chartData){
    var dataSet = []
    zeroethKey = Object.keys(chartData)[0];
    firstKey = Object.keys(chartData)[1]; 
    secondKey = Object.keys(chartData)[2];
    for(var i =0; i < chartData[zeroethKey].length; i++){
        chartData[zeroethKey][i] = "(" + chartData[zeroethKey][i] + ") " + chartData[secondKey][i]; 
    }
    for(var i =0; i < chartData[zeroethKey].length; i++){
        dataSet.push(chartData[zeroethKey][i].split());
        dataSet[i].push(chartData[firstKey][i]);
    }
    return dataSet;
}


// $("getStats").click(function(e) {
//     e.preventDefault();
//     $.ajax({
//         type: "POST",
//         url: "/pages/test/",
//         data: { 
//             id: $("#getStats").val(), // < note use of 'this' here
//             access_token: $("#access_token").val() 
//         },
//         success: function(result) {
//             alert('ok');
//         },
//         error: function(result) {
//             alert('error');
//         }
//     });
// });

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

$("#datepicker1").on("change keyup paste", function(){    
    if($("#datepicker2").datepicker("getDate") < $("#datepicker1").datepicker("getDate")){
        document.getElementById("getStatss").disabled = true;
    }
    var day = this.value.slice(3,5);
    var month = this.value.slice(0,2);
    var year = this.value.slice(6,10);
    state.startDate = year + "-" + month + "-"+day;
    if (state.groupURL != ""){
        helperRequestData();
    }
})

$("#datepicker2").on("change keyup paste", function(){
    if($("#datepicker2").datepicker("getDate") < $("#datepicker1").datepicker("getDate")){
        document.getElementById("getStatss").disabled = true;
    }
    var day = this.value.slice(3,5);
    var month = this.value.slice(0,2);
    var year = this.value.slice(6,10);
    state.endDate = year + "-" + month + "-"+day;
    if (state.groupURL != ""){
        helperRequestData();
    }
})

$("#helpButtonDiv").on('click', function(event) {
    $('.ui.modal')
        .modal('show')
    ;
})

function myFunction () {
    $('.ui.modal')
        .modal('show')
    ;
}

function helperRequestData() {
    $('.loading').show();
    $('.loading1').show();
    $('.loading2').show();
    $('.loading3').show();
    $('.url-message').hide(); 
    // if (progress1 == false && p2 == false && p3 == false && p4 == false){
    //     $('.white-box').show("slow", function(){
    //         requestData('membersOverTime');
    //         requestData('departments');
    //         requestData('topContent');
    //         requestData('pageViews');
    //     }); 
    // }
    //xmlHttp.abort();
    $('.white-box').show("slow", function(){
        requestData('uniquePageviews');
        requestData('membersOverTime');
        requestData('departments');
        requestData('topContent');
        requestData('pageViews');
        requestData('avgTimeOnPage');
    })
}

document.getElementById('getStatss').title="URLs should be of the format https://gcollab.ca/groups/profile...";

tippy('.ui button', {
    createPopperInstanceOnInit: false,
    hideOnClick: false,
    trigger: 'click',
    trigger: 'mouseenter focus',
    dynamicTitle: true,
    // animateFill: true,
    animation: 'fade',
    arrow: true,
    arrowType: 'round',
    // theme: 'dark custom',
})

document.getElementById("getStatss").addEventListener("mouseover", function(){
    state.groupURL = document.getElementById("statsurl").value;
    try{
        document.getElementById("getStatss")._tippy.destroy();
    }
    catch(err){
        console.log('error destroying tippys');
    }
    if(!URLIsValid(state.groupURL)){
        document.getElementById('getStatss').title=URLErrorMessage(state.groupURL)
        tippy('.ui button', {
            createPopperInstanceOnInit: false,
            hideOnClick: false,
            trigger: 'click',
            trigger: 'mouseenter focus',
            dynamicTitle: true,
            animation: 'fade',
            arrow: true,
            arrowType: 'round'
        })
    }
    else{
        // document.getElementById("getStatss")._tippy.destroy();
        document.getElementById('getStatss').removeAttribute("title");
    }
});

jQuery('#statsurl').on('input', function() {
    state.groupURL = document.getElementById("statsurl").value;
    if(!URLIsValid(state.groupURL)){
        document.getElementById('getStatss').title=URLErrorMessage(state.groupURL)
        if(state.groupURL!=""){
            document.getElementById("statsurl").style.backgroundColor='#fff6f6';
            document.getElementById("statsurl").style.borderColor='#e0b4b4';
            document.getElementById("statsurl").style.color='#9f3a38';
        }
        else{
            document.getElementById("statsurl").style.backgroundColor='#fff';
            document.getElementById("statsurl").style.borderColor='rgba(34,36,38,.15)';
            document.getElementById("statsurl").style.color='rgba(0,0,0,.87)';
        }
    }
    else{
        document.getElementById('getStatss').removeAttribute("title");
        document.getElementById("statsurl").style.backgroundColor='#fff';
        document.getElementById("statsurl").style.borderColor='rgba(34,36,38,.15)';
        document.getElementById("statsurl").style.color='rgba(0,0,0,.87)';
    }
});

document.getElementById("getStatss").addEventListener("click", function(){
    state.groupURL = document.getElementById("statsurl").value;
    if(!URLIsValid(state.groupURL)){
        document.getElementById('getStatss').title=URLErrorMessage(state.groupURL)
        document.getElementById("statsurl").style.backgroundColor='#fff6f6';
        document.getElementById("statsurl").style.borderColor='#e0b4b4';
        document.getElementById("statsurl").style.color='#9f3a38';
    }
    else{
        document.getElementById('getStatss').removeAttribute("title");
        document.getElementById("statsurl").style.backgroundColor='#fff';
        document.getElementById("statsurl").style.borderColor='rgba(34,36,38,.15)';
        document.getElementById("statsurl").style.color='rgba(0,0,0,.87)';
        helperRequestData();
    }
});

// Basic check to make sure the URL is actually a group page
function URLIsValid(url) {
    if (url.indexOf('https://gccollab.ca/groups/profile') === 0)
        return true;
    else
        return false;
}

function URLErrorMessage(url){
    if ((url.indexOf('https://gccollab.ca/') === 0) && !this.URLIsValid(url) ) {
        // URL is from collab, but not a group's main page.
        // In the future relevant stats will be served for whatever content is requested.
        // Right now, provide an error + explanation
        if(currentLang=='EN'){
            return "This tool currently only supports group stats. Enter a group's main page URL (https://gcollab.gc.ca/groups/profile...)"
        }
        else{
            return "Cet outil prend actuellement en charge uniquement les statistiques de groupe. Entrez l'URL de la page principale d'un groupe (https: //gcollab.gc.ca/groups/profile ...)"
        }
    } else if (url.indexOf('https://gcconnex') === 0) {
        if(currentLang=='EN'){
            return "This tool is currently only available for GCcollab groups."
        }
        else{
            return "Cet outil est actuellement disponible uniquement pour les groupes GCcollab."
        }
    } else {
        if(currentLang=='EN'){
            return "URLs should be of the format https://gcollab.ca/groups/profile...";
        }
        else{
            return "Les URL doivent être au format https: //gcollab.ca/groups/profile ...";
        }
    }
}

var state = {
    // Each metric's specific state. Populated after data is received
    membersOverTime: {},
    departments: {},
    topContent: {},
    pageViews: {}
};
function dateConverter(d) {
    year = String(d.getFullYear());
    day = String(d.getDate());
    month = String(d.getMonth() + 1);
    if (day.length == 1){
        day = "0" + day;
    }
    if (month.length == 1){
        month = "0" + month;
    }
    return year + "-" + month + "-" + day;
}
var d = new Date();
d.setFullYear(d.getFullYear()-1);
state.startDate = dateConverter(d);
state.endDate = dateConverter(new Date());
state.groupURL = "";

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}

var finishedLoadingPageViews = false;
var finishedLoadingAvgTimeOnPAge = false;
var finishedLoadingUniqueViews = false;

function requestData(reqType) {
    lineChartViews = c3.generate({
        bindto: '#chart1',
        size: {
            height: 200,    //size set same the datatable
            //width: 480    //default size is full width of page
        },
        data: {
            x: 'dates',
            xFormat: '%Y-%m-%d',
            columns: [
                // columnss,   // example of what is being passed ['x', "20170831", "20170930", "20171031", "20171130", "20171231", "20180131", "20180228", "20180331", "20180430", "20180531"],
                // dataa,      // example of what is being passed ['users', 20, 26, 26, 27, 27, 31, 34, 34, 34, 43]
            ],
            // color: function (color, d) {
            //     // d will be 'id' when called for legends
            //     return d.id && d.id === valueKey ? d3.rgb(color).darker(d.value / 30) : color;
            //     },
        },
        legend: {
            show: false
        },
        axis: {
            x: {
                type: 'timeseries',
            tick: {
                format: '%Y-%m-%d'
                }
            }
        },
        groupName: '',
        onrendered: function() {
            d3.selectAll(".c3-axis.c3-axis-x .tick text")
                .style("display", "none");
        }
    });
    lineChartMembers = c3.generate({
        bindto: '#chart2',
        size: {
            height: 200,    //size set same the datatable
            //width: 480    //default size is full width of page
        },
        data: {
            x: 'dates',
            xFormat: '%Y-%m-%d',
            columns: [
                // columnss,   // example of what is being passed ['x', "20170831", "20170930", "20171031", "20171130", "20171231", "20180131", "20180228", "20180331", "20180430", "20180531"],
                // dataa,      // example of what is being passed ['users', 20, 26, 26, 27, 27, 31, 34, 34, 34, 43]
            ],
            // color: function (color, d) {
            //     // d will be 'id' when called for legends
            //     return d.id && d.id === valueKey ? d3.rgb(color).darker(d.value / 30) : color;
            //     },
        },
        legend: {
            show: false
        },
        axis: {
            x: {
                type: 'timeseries',
            tick: {
                format: '%Y-%m-%d'
                }
            }
        },
        groupName: '',
        onrendered: function() {
            d3.selectAll(".c3-axis.c3-axis-x .tick text")
                .style("display", "none");
        }
    });
    progress1 = true;
    p2 = true;
    p3 = true;
    p4 = true;
    p5 = true;
    // Form correct request based on request type
    // Really ugly, needs back end changes
    var reqStatement = ""; // Populate this with the request
    switch (reqType) {
        case 'membersOverTime':
            reqStatement = JSON.stringify({
                type: 'groups',
                stat: 'membersOverTime',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        case 'departments':
            reqStatement = JSON.stringify({
                type: 'groups',
                stat: 'membersByDepartment',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        case 'topContent':
            reqStatement = JSON.stringify({
                type: 'groups',
                stat: 'topContent',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        case 'pageViews':
            reqStatement = JSON.stringify({
                type: 'groups',
                stat: 'pageviews',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        case 'uniquePageviews':
            reqStatement = JSON.stringify({
                type: 'pages',
                stat: 'uniquePageviews',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        case 'avgTimeOnPage':
            reqStatement = JSON.stringify({
                type: 'pages',
                stat: 'avgTimeOnPage',
                url: state.groupURL,
                start_date: state.startDate,
                end_date: state.endDate
            });
            break;
        }
    // Send the request
    //reqStatement = JSON.parse('{"stepIndex":4,"reqType":{"category":1,"filter":"https://gccollab.ca/groups/profile/718/canada-indigenous-relations-creating-awareness-fostering-reconciliation-and-contributing-to-a-shared-future-relations-canada-et-peuples-indigenes-promouvoir-la-sensibilisation-favoriser-la-reconciliation-et-contribuer-a-un-avenir-partager"},"metric":2,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}');
    //console.log(reqStatement);
    //reqStatement = JSON.stringify(reqStatement);
    //var data = {name:"John"}
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            
            resp = JSON.parse(this.response);
            switch(reqType) {
                case 'membersOverTime':
                    progress1 = false;
                    chartData2 = resp;
                    // console.log(chartData2);
                    mainLine(2);
                    $('.loading1').hide();
                    break;
                case 'departments':
                    p2 = false;
                    barChartData1 = resp;
                    // console.log(barChartData1);
                    mainBar(1, 'departments', resp);
                    $('.loading2').hide();
                    break;
                case 'topContent':
                    p3 = false;
                    barChartData2 = resp;
                    // console.log(barChartData2);
                    hardCopybcden = $.extend(true, {}, barChartData2);
                    hardCopybcdfr = $.extend(true, {}, barChartData2);
                    for (var i = 0; i < hardCopybcden['urls'].length; i++){
                        hardCopybcdfr['urls'][i] = toFrench(hardCopybcdfr['urls'][i])
                    }
                    updatedTitle();
                    mainBar(2, 'topContent', resp);
                    $('.loading3').hide();
                    break;
                case 'pageViews':
                    p4 = false;
                    finishedLoadingPageViews = true;
                    if(finishedLoadingAvgTimeOnPAge == true && finishedLoadingPageViews == true && finishedLoadingUniqueViews == true){
                        finishedLoadingAvgTimeOnPAge = false;
                        finishedLoadingPageViews = false;
                        finishedLoadingUniqueViews = false;
                        $('.loading').hide();
                    }
                    chartData1 = resp;
                    // console.log(chartData1);
                    document.getElementById("title").innerHTML=replaceAll(chartData1.group_name, "-", " ");
                    // console.log(chartData1.group_name)
                    mainLine(1, chartData1)
                    
                    break;
                case "avgTimeOnPage":
                    p5 = false;
                    finishedLoadingAvgTimeOnPAge = true;
                    if(finishedLoadingAvgTimeOnPAge == true && finishedLoadingPageViews == true && finishedLoadingUniqueViews == true){
                        finishedLoadingAvgTimeOnPAge = false;
                        finishedLoadingPageViews = false;
                        finishedLoadingUniqueViews = false;
                        $('.loading').hide();
                    }
                    avgTimeOnPageResp = resp;
                    mainLine(3)
                    break;
                case 'uniquePageviews':
                    p6 = false;
                    finishedLoadingUniqueViews = true;
                    if(finishedLoadingAvgTimeOnPAge == true && finishedLoadingPageViews == true && finishedLoadingUniqueViews == true){
                        finishedLoadingAvgTimeOnPAge = false;
                        finishedLoadingPageViews = false;
                        finishedLoadingUniqueViews = false;
                        $('.loading').hide();
                    }
                    var unique = true;
                    uniqueViewsResp = resp;
                    mainLine(1, uniqueViewsResp, unique);
                    break;
            }
            setTimeout(function() {
                $(window).trigger('resize');
            }, 0);
       }
       if(progress1 == false && p2 == false && p3 == false && p4 == false && p5 == false){
            setTimeout(function(){
            if (currentLang == "FR"){
                $("#fr-toggle").trigger("click");
            }}, 250);
       }
    };
    xmlHttp.open("POST", "/api", true); // false for synchronous request
    xmlHttp.setRequestHeader("Content-type", "application/json");
    xmlHttp.send(reqStatement);
}

$(document).ready(function(){
    $('.white-box').hide();
});