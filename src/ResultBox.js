import React, {Component} from 'react';
//import LineChart from './LineChart';
import DonutChart from './DonutChart';
import LineChart2 from './LineChart2';
import LineChartMembers from './LineChartMembers';
import ContentBarChart from './ContentBarChart';
import MemberDepChart from './MemberDepChart';
import NumRegisteredUsers from './NumRegisteredUsers';

import './ContentBox.css'

class ResultBox extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props)
    }
    // Need some way to decide what kind of charts to show *before* making the request
    getVisType = () => {
        let state = this.props.superState();
        if (state.reqType.category === 1 && state.metric === 1) {
            // Group pageviews
            return [LineChart2, 'Group pageviews'];
        } else if (state.reqType.category === 1 && state.metric === 2) {
            // Group top content
            return [ContentBarChart, 'Top group content'];
            // This is not ideal -> set up bar charts in the near future
        } else if (state.reqType.category === 1 && state.metric === 3) {
            // Group members
            return [LineChartMembers , 'Group members over time'];

        } else if (state.reqType.category === 1 && state.metric === 4) {
            return [MemberDepChart, 'Group members by department'];
        } else if (state.reqType.category === 2 && state.reqType.filter === 1) {
            // Users -> all users (Show how many users in time period)
            return [NumRegisteredUsers, 'Number of registered users on the platform'];
        } else if (state.reqType.category === 2 && state.reqType.filter === 2) {
            // Users -> By particular department
            return [NumRegisteredUsers, 'Number of users from <insert department here>'];
        }
    }


    render() {
        // Decide on chart type
        let [Vis, message] = this.getVisType();
        let w = 500, h = 200;
        return (
            <div>
                <Vis superState={this.props.superState} title={message} />
            </div>
        );
    }
}

export default ResultBox;
//<LineChart w={w} h={h} superState={this.props.superState} />
//<LineChart2 title={'Pageviews for '} superState={this.props.superState} />

//<DonutChart superState={this.props.superState} title="Users by department" />
// DonutChart works just fine
// LineChart2 works just fine