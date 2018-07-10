import React, {Component} from 'react';
import Subheader from 'material-ui/Subheader';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';

import { ValidatorForm } from 'react-form-validator-core';
import { TextValidator } from 'react-material-ui-form-validator';

import './TypeBox.css';

class TypeBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            mainDropValue: 1,
            userDropValue: 1,
            urlValue: "",
            visibleElements: {
                userDrop: 'hidden',
                urlField: ''
            }
        };
    }

    // Allow user to set value in dropdown
    handleMainChange = (event, index, mainDropValue) => {
        this.setState({mainDropValue});
        // Need to handle hiding / showing of different components
        switch (mainDropValue) {
            case 1:
                // Groups category is chosen
                this.setState({visibleElements : {userDrop: 'hidden', urlField: ''}}, () => {
                    this.props.setters.setType({
                        category: 1,
                        filter: this.state.urlValue // Should instead be taking this from text field
                    });
                });
                break;
            case 2:
                // Users category is chosen
                this.setState({visibleElements : {userDrop: '', urlField: 'hidden'}}, () => {
                    this.props.setters.setType({
                        category: 2,
                        filter: this.state.userDropValue
                    });
                });
                break;
        }
    }

    // Restore previously set state on mount
    componentWillMount = () => {
        // Add form validation to URL field
        ValidatorForm.addValidationRule('isValidUrl', (value) => {
            if (value.includes('gcconnex.gc.ca/groups/')) {
                this.props.setters.setErrorFlag(false);
                return true;
            }
            else {
                // Set flag in MainView to false
                // Still need to make this prevent going forward
                this.props.setters.setErrorFlag(true);
                return false;
            }
        });

        let reqType = this.props.superState().reqType;
        this.setState({
            mainDropValue: reqType.category,
        });
        switch (reqType.category) {
            case 1:
                this.setState({
                    urlValue: reqType.filter,
                    visibleElements : {
                        userDrop: 'hidden',
                        urlField: ''
                    }
                });
                break;
            case 2:
                this.setState({
                    userDropValue: reqType.filter,
                    visibleElements: {
                        userDrop: '',
                        urlField: 'hidden'
                    }
                });
                break;
        }
    }

    // Update parent state 
    handleUserChange = (event, index, userDropValue) => {
        this.setState({userDropValue});
        this.props.setters.setType({
            category: 2,
            filter: userDropValue
        });
    }

    // Update parent state
    handleURLchange = (event, newValue) => {
        this.props.setters.setType({
            category: this.state.mainDropValue,
            filter: newValue
        });
        this.setState({
            urlValue: newValue
        });
    }

    render() {
        const urlFieldClasses = this.state.visibleElements['urlField'] + ' groups-entry';
        const userFieldClasses = this.state.visibleElements['userDrop'] + ' dropdown';
        return (
            <div>
                <div className="box-content">
                    Please select the category you wish to find data for.
                    <div className="selectionContainer">
                        <DropDownMenu value={this.state.mainDropValue} onChange={this.handleMainChange} autoWidth={false} fullWidth={true} className="dropdown" >
                            <MenuItem value={1} primaryText="Groups" />
                            <MenuItem value={2} primaryText="Users" />
                            <MenuItem value={3} primaryText="Content" />
                        </DropDownMenu>

                        <ValidatorForm >
                            <TextValidator 
                                floatingLabelText="Copy & paste the group page URL here"
                                className={urlFieldClasses}
                                fullWidth={true}
                                value={this.state.urlValue}
                                onChange={this.handleURLchange}
                                validators={['isValidUrl']}
                                errorMessages={['URL is invalid.']}
                                name="group url field"
                            />
                        </ValidatorForm>
                        <Subheader className={userFieldClasses + ' subhead'}>How would you like to narrow down your users?</Subheader>
                        <DropDownMenu value={this.state.userDropValue} onChange={this.handleUserChange} className={userFieldClasses} autoWidth={false}>
                            <MenuItem value={1} primaryText="All users" />
                            <MenuItem value={2} primaryText="From a particular department" />
                            <MenuItem value={3} primaryText="By specific interests" />
                            <MenuItem value={4} primaryText="By specific skills" />
                        </DropDownMenu>
                    </div>
                </div>
            </div> 
        );
    }
}

export default TypeBox;