import React, {Component} from 'react';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import depts from './en_dpts.json';

import './MetricBox.css';

class MetricBox extends Component {

    constructor(props) {
        super(props);
        this.state = {
            groupDropValue: 1,
            departmentDropValue: 1,
            usersDropValue: 1,
            depMetricDropValue: 1,
            visibleElements: {
                userDrop: '',
                groupsDrop: '',
                depDrop: 'hidden'
            },
            userTypeOption: 1,
            greetingPhrase: "Please select the metric you are looking for.",
            metricText: ""
        }
    }

    // Returns true or false depending on validity of user-entered url
    // Specifically for groups requests
    // This will be called as text is entered and met with a tooltip
    validGroupUrl = (urlString) => {
        if (urlString.includes('gcconnex.gc.ca/groups/profile/'))
            return true;
        else
            return false;
    }
    // Will need to be more robust when individual pageviews are implemented

    handleGroupMetricChange = (event, index, value) => {
        this.setState({groupDropValue: value});
        // Pass the value up to the main component
        this.props.setters.setMetric(value);
    }

    handleDepChange = (event, index, value) => {
        this.setState({departmentDropValue: value});
        this.props.setters.setMetric(value);
    }

    // New
    handleDepMetricChange = (event, index, value) => {
        this.setState({depMetricDropValue: value});
        this.props.setters.setMetric2(value);
    }

    handleUserMetricChange = (event, index, value) => {
        this.setState({usersDropValue: value});
        this.props.setters.setMetric(value);
    }

    handleTextMetricChange = (event, newValue) => {
        this.setState({metricText: newValue});
        this.props.setters.setMetric(newValue);
    }

    componentWillMount = () => {
        // Check Type of request before rendering anything
        // Determine which view to show based on type
        let generalType = this.props.superState().reqType.category;
        if (generalType === 1) /* Groups type */ {
            // Display the group options
            this.setState({
                visibleElements : {
                    userDrop: 'hidden',
                    groupsDrop: '',
                    depDrop: 'hidden'
                },
                groupDropValue: this.props.superState().metric
            });
        } else if (generalType === 2) /* Users type */ {
            this.setState({
                visibleElements : {
                    userDrop: 'hidden',
                    groupsDrop: 'hidden',
                    depDrop: ''
                }
            });
            let userType = this.props.superState().reqType.filter;
            switch (userType) {
                case 1: /* All users */
                    this.setState({greetingPhrase : "Please select the metric you are looking for."});
                    this.setState({
                        userTypeOption: 1,
                        usersDropValue: this.props.superState().metric
                    });
                    break;
                case 2: /* By department */
                    this.setState({greetingPhrase : "Please select the department to draw user stats from."});
                    this.setState({
                        userTypeOption: 2,
                        departmentDropValue: this.props.superState().metric
                    });
                    break;
                case 3: /* Interests */
                    this.setState({greetingPhrase : "Please enter the interest you would like to screen users for."});
                    this.setState({userTypeOption: 3});
                    if (!Number.isInteger(this.props.superState().metric)) {
                        this.setState({metricText: this.props.superState().metric});
                    }
                    break;
                case 4: /* Skills */
                    this.setState({greetingPhrase : "Please enter the skill you would like to screen users for."});
                    this.setState({userTypeOption: 3});
                    if (!Number.isInteger(this.props.superState().metric)) {
                        this.setState({metricText: this.props.superState().metric});
                    }
                    break;
            }
        }
    }

    render() {
        const groupFieldClasses = this.state.visibleElements.groupsDrop + ' metricDropDown';
        const depFieldClasses = this.state.visibleElements.depDrop + ' metricDropDown';
        const userFieldClasses = this.state.visibleElements.userDrop + ' metricDropdown';

        // Need classes for individual dropdown/text field / none
        //const userClasses = this.state.userTypeOption;
        const message = this.state.greetingPhrase;

        let textFieldClass = '';
        let dropDownClass = '';
        let userDropClass = '';

        // Handle displayed / not displayed components
        switch (this.state.userTypeOption) {
            case 1:
                userDropClass = '';
                textFieldClass = 'hidden';
                dropDownClass = 'hidden';
                break;
            case 2:
                userDropClass = 'hidden';
                textFieldClass = 'hidden';
                dropDownClass = '';
                break;
            case 3:
                userDropClass = 'hidden';
                textFieldClass = '';
                dropDownClass = 'hidden';
                break;
            case 4:
                userDropClass = 'hidden';
                textFieldClass = '';
                dropDownClass = 'hidden';
                break;
        }
        // Fix user options showing up when groups is selected
        // Logic in here is getting hideous, need to refactor this whole class
        if (this.props.superState().reqType.category === 1) {
            userDropClass = 'hidden';
        }

        // Build list of departments from file
        let dep_list = Object.keys(depts).map(key => depts[key]);

        return (
            <div>
                <p className="box-content">
                    {message}
                </p>
                <DropDownMenu value={this.state.groupDropValue} onChange={this.handleGroupMetricChange} autoWidth={false} fullWidth={true} className={groupFieldClasses}>
                    <MenuItem value={1} primaryText="Page views" />
                    <MenuItem value={2} primaryText="Top content" />
                    <MenuItem value={3} primaryText="Number of members" />
                    <MenuItem value={4} primaryText="Members by department" />
                </DropDownMenu>
                <DropDownMenu value={this.state.usersDropValue}
                    onChange={this.handleUserMetricChange}
                    autoWidth={false}
                    maxHeight={200}
                    fullWidth={true}
                    className={userDropClass + ' metricDropDown'}>
                        <MenuItem value={1} primaryText="Number of registered users" />
                        <MenuItem value={2} primaryText="Number of active users (activity in last 60 days)" />
                </ DropDownMenu>
                <div className={depFieldClasses}>
                    <DropDownMenu value={this.state.departmentDropValue}
                        onChange={this.handleDepChange}
                        autoWidth={false}
                        maxHeight={200}
                        className={dropDownClass + ' userDrop'}>
                            {dep_list.map((dep, index) => 
                                <MenuItem value={index} primaryText={dep} />
                            )}
                    </DropDownMenu>
                    <p className={dropDownClass + ' box-content'}> Select the metric you are looking for. </p>
                    <DropDownMenu value={this.state.depMetricDropValue}
                        onChange={this.handleDepMetricChange}
                        autoWidth={false}
                        maxHeight={200}
                        className={dropDownClass + ' userDrop'}>
                            <MenuItem value={1} primaryText="Number of registered users" />
                            <MenuItem value={2} primaryText="Number of users opted in to the Opportunities Platform" />
                    </DropDownMenu>
                    <TextField
                        floatingLabelText="Enter text here"
                        className={textFieldClass + ' textField'}
                        value={this.state.metricText}
                        onChange={this.handleTextMetricChange}
                    />
                </div>
            </div> 
        );
    }
}

export default MetricBox;