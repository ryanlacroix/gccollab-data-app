import React, {Component} from 'react';
import DatePicker from 'material-ui/DatePicker';
import Checkbox from 'material-ui/Checkbox';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import moment from 'moment'

import './TimeBox.css';

class TimeBox extends Component {

    constructor(props) {
        super(props);

        const date1 = new Date();
        const date2 = new Date();
        date1.setFullYear(date1.getFullYear() - 1);
        this.state = {
            startDate: date1,
            endDate: date2,
            allTime: true
        }
    }

    updateSuperState = () => {
        this.props.setters.setTime({
            startDate: moment(this.state.startDate).format('YYYY-MM-DD'),
            endDate: moment(this.state.endDate).format('YYYY-MM-DD'),
            allTime: this.state.allTime
        });
    }

    handleStartChange = (event, date) => {
        this.setState({
            startDate: date
        }, () => {
            this.updateSuperState();
        });
    };

    handleEndDate = (event, date) => {
        this.setState({
            endDate: date
        }, () => {
            this.updateSuperState();
        });
    };

    handleCheckBox = (event, boxState) => {
        this.setState({
            allTime: boxState
        }, () => {
            this.updateSuperState();
        });
    };

    componentWillMount = () => {
        let timeState = this.props.superState().time;
        // check if range previously set
        if (typeof(timeState.startDate) === 'string' && typeof(timeState.endDate) === 'string') {
            this.setState({
                startDate: new Date(timeState.startDate),
                endDate: new Date(timeState.endDate),
                allTime: timeState.allTime
            });
        } else {
            // Set initial values for superState
            this.updateSuperState();
        }
    }

    render() {
        return (
            <div>
                <p className="box-content">
                    Enter the date range you are interested in. 
                </p>
                <div className="datePickers">
                    <DatePicker
                        onChange={this.handleStartChange}
                        floatingLabelText="Start date"
                        defaultDate={this.state.startDate}
                        textFieldStyle={{width: '90%'}}
                        disabled={this.state.allTime}
                    />
                    <DatePicker
                        onChange={this.handleEndDate}
                        floatingLabelText="End date"
                        defaultDate={this.state.endDate}
                        textFieldStyle={{width: '90%'}}
                        disabled={this.state.allTime}
                    />
                    <Checkbox
                        label="All-time"
                        style={{paddingTop: '0px', display: 'inline-block', verticalAlign: 'bottom'}}
                        checked={this.state.allTime}
                        onCheck={this.handleCheckBox}
                        className="allTime"
                    />
                    
                </div>
            </div> 
        );
    }
}

export default TimeBox;