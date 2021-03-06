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
        this.state = {
            groupNameEN: "",
            groupNameFR: ""
        }
    }

    myCallBack = (dataFromChild) =>{
        console.log(dataFromChild[0])
        console.log(this.state.groupNameEN)
        if (this.state.groupNameEN != dataFromChild[0]){
            this.setState({
                groupNameEN: dataFromChild[0],
                groupNameFR: dataFromChild[1]
            })
        }
    }

    render() {
        if(this.props.URLType === 'collab-group')
            return (
                <div class="bigBox" style={{margin: '0 auto', backgroundColor: '#fff', border: '2px solid lightgray', borderRadius: '5px', width: '95%'}}>
                    <div className="pageviews" style={{width: '100%'}}>
                        <LineChart2
                            title="Page views"
                            className='linechart1'
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL}
                            superState={this.props.endDate}
                            language={this.props.language}
                            initLang={this.props.initLang}
                            groupNameEN={this.state.groupNameEN}
                            groupNameFR={this.state.groupNameFR}
                            setGroupUrl={this.props.setGroupUrl}
                            stat='pageviews'
                        />
                    </div>
                    <div className="membership" style={{width: '100%'}}>
                        <LineChartMembers
                            title="Group Membership"
                            superState={this.props.superState}
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL}  
                            language={this.props.language}
                            initLang={this.props.initLang}
                            URLType={this.props.URLType}
                            PrevURLType={this.props.PrevURLType}  
                        />
                    </div>
                    <div className="deps" style={{width: '100%'}}>
                        <MemberDepChart
                            title="Group Members by Institution"
                            superState={this.props.superState}
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL} 
                            language={this.props.language}
                            initLang={this.props.initLang}
                            URLType={this.props.URLType}
                            PrevURLType={this.props.PrevURLType}
                        />
                    </div>
                    <div className="top-content" style={{width: '100%'}}>
                        <ContentBarChart
                            title="Top Group Content"
                            superState={this.props.superState}
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL}
                            language={this.props.language}
                            initLang={this.props.initLang}
                            callbackFromParent = {this.myCallBack}
                            URLType={this.props.URLType}
                            PrevURLType={this.props.PrevURLType}
                        />
                    </div>
                </div>
            );
        if (this.props.URLType === 'collab-page')
            return (
                <div class="bigBox" style={{margin: '0 auto', backgroundColor: '#fff', border: '2px solid lightgray', borderRadius: '5px', width: '95%'}}>
                    <div className="pageviews" style={{width: '100%'}}>
                        <LineChart2
                            title="Page views"
                            className='linechart1'
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL}
                            superState={this.props.endDate}
                            language={this.props.language}
                            initLang={this.props.initLang}
                            setGroupUrl={this.props.setGroupUrl}
                            setURLType={this.props.setURLType}
                        />
                    </div>
                </div>
            );
        if (this.props.URLType === 'connex-page')
            return (
                <div class="bigBox" style={{margin: '0 auto', backgroundColor: '#fff', border: '2px solid lightgray', borderRadius: '5px', width: '95%'}}>
                    <div className="pageviews" style={{width: '100%'}}>
                        <LineChart2
                            title="Page views"
                            className='linechart1'
                            startDate={this.props.startDate}
                            endDate={this.props.endDate}
                            groupURL={this.props.groupURL}
                            superState={this.props.endDate}
                            language={this.props.language}
                            initLang={this.props.initLang}
                            URLType={'gcconnex'}
                        />
                    </div>
                </div>
            );
    }
}

export default Content;