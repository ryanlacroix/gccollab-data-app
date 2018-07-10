import React, {Component} from 'react';

import './Content.css';

// Visualization / datatable stuff
import LineChartMembers from './LineChartMembers';
import './LineChartMembers.css';
import ContentBarChart from './ContentBarChart';
import './ContentBarChart.css';
import MemberDepChart from './MemberDepChart';
import './MemberDepChart.css';
import LineChart2 from './LineChart2';
import './LineChart2.css';


class Content extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        return (
            <div style={{margin: '0 auto', backgroundColor: '#fff', border: '2px solid lightgray', borderRadius: '5px', width: '95%'}}>
                <div className="pageviews" style={{width: '100%'}}>
                    <LineChart2
                        title="Page views"
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        groupURL={this.props.groupURL}
                        superState={this.props.endDate}
                    />
                </div>
                <div className="membership" style={{width: '100%'}}>
                    <LineChartMembers
                        title="Group Membership"
                        superState={this.props.superState}
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        groupURL={this.props.groupURL}    
                    />
                </div>
                <div className="deps" style={{width: '100%'}}>
                    <MemberDepChart
                        title="Group Members by Department"
                        superState={this.props.superState}
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        groupURL={this.props.groupURL} 
                    />
                </div>
                <div className="top-content" style={{width: '100%'}}>
                    <ContentBarChart
                        title="Top Group Content"
                        superState={this.props.superState}
                        startDate={this.props.startDate}
                        endDate={this.props.endDate}
                        groupURL={this.props.groupURL}
                    />
                </div>
            </div>
        );
    }
}

export default Content;