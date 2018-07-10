import React, {Component} from 'react';

import WelcomeBox from './WelcomeBox';
import TypeBox from './TypeBox';
import MetricBox from './MetricBox';
import TimeBox from './TimeBox';
import ResultBox from './ResultBox';

import './ContentBox.css'

class ContentBox extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props)
        this.state = {
            boxMapping : [
                WelcomeBox,
                TypeBox,
                MetricBox,
                TimeBox,
                ResultBox
            ]
        }
    }
    
    render() {
        let CurrBox = this.state.boxMapping[this.props.currBox]
        return (
            <div>
                <CurrBox className="content" setters={this.props.setters} superState={this.props.superState}/>
            </div>
        );
    }
}

export default ContentBox;