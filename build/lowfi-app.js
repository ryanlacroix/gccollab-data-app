// This file contains all logic for the non-react version of the data app

var state = {
    startDate: null,
    endDate: null,
    groupURL = "",
    // Each metric's specific state. Populated after data is received
    membersOverTime: {},
    departments: {},
    topContent: {},
    pageViews: {}
}

function requestData(reqType) {
    // Form correct request based on request type
    // Really ugly, needs back end changes
    var reqStatement = ""; // Populate this with the request
    switch (reqType) {
        case 'membersOverTime':
            reqStatement = '{"stepIndex":4,"reqType":{"category":1,"filter":"'+
                state.groupURL +'"},"metric":3,"metric2":0,"time":{"startDate":"'+
                state.startDate +'","endDate":"'+ state.endDate +'","allTime":true},"errorFlag":false}';
            break;
        case 'departments':
            reqStatement = '{"stepIndex":4,"reqType":{"category":1,"filter":"'+ 
                state.groupURL +'"},"metric":4,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}'
            break;
        case 'topContent':
            reqStatement = '{"stepIndex":4,"reqType":{"category":1,"filter":"'+
                state.groupURL +'"},"metric":2,"metric2":0,"time":{"startDate":"2017-02-12","endDate":"2018-02-12","allTime":true},"errorFlag":false}'
            break;
        case 'pageViews':
            reqStatement = '{"stepIndex":4,"reqType":{"category":1,"filter":"'+ 
                state.groupURL +'"},"metric":1,"metric2":0,"time":{"startDate":"' + 
                state.startDate +'","endDate":"' + 
                state.endDate +'","allTime":true},"errorFlag":false}';
            break;
        }
    // Send the request
    $.ajax({
        type: 'POST',
        datatype: 'json',
        url: '/getData/request',
        body: reqStatement,
        success: function(resp) {
            switch(reqType) {
                case 'membersOverTime':
                    handleMembersOverTimeRequest(resp);
                    break;
                case 'departments':
                    handleDepartmentsRequest(resp);
                    break;
                case 'topContent':
                    handleTopContentRequest(resp);
                    break;
                case 'pageViews':
                    handlePageViewsRequest(resp);
                    break;
            }
        }
    });
}

// Munge members over time data and pass to chart / table
function handleMembersOverTimeRequest(data) {
    state.membersOverTime = {
        data: {
            x: 'date',
            columns: [],
            xFormat: '%Y%m%d',
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
        // Hide / show the vis and table. Might handle this differently later
        loaderClass: '',
        contentClass: 'hidden'
    }
    data[state.membersOverTime.interval].users = data[state.membersOverTime].users.map(Number);
    data[state.membersOverTime.interval].users.unshift('users');
    data[state.membersOverTime.interval]
}
