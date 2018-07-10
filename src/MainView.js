import React, {Component} from 'react';
import Paper from 'material-ui/Paper';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';

import AppBar from 'material-ui/AppBar'

import GCTools from './GCToolsSmallerFill.png';

import './MainView.css';

import Steps from './Steps';
import ContentBox from './ContentBox';


const style = {
    height: 'auto', // This must be changed in accordance with content in the result box
    minHeight: 400,
    width: 600,
    margin: 20,
    //textAlign: 'center',
    display: 'inline-block',
    justifyContent: 'flex-end',
    flex: 1,
    position: 'relative'
};

const titleStyle = {
    textAlign: 'left'
};

const nextButtonStyle = {
    //verticalAlign: 'bottom'
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    //justifyContent: 'flex-end'
};

const backButtonStyle = {
    position: 'absolute',
    bottom: '10px',
    right: '110px'
}

class MainView extends Component {
    // This state holds the overall state of the application's different views
    state = {
        stepIndex: 0,
        reqType: {
            category: 1,
            filter: "",
        },
        metric: 1,
        metric2: 0, // Only used for extended metrics, eg users -> dep -> num users
        time: {
            startDate: 0,
            endDate: 0,
            allTime: true
        },
        errorFlag: false // Lock stepper if issues are present
    };

    // State setters to be passed down to child components
    setters = {
        setType : (typeObj) => {
            this.setState({
                reqType: typeObj
            });
        },
        setMetric : (metricObj) => {
            this.setState({
                metric: metricObj
            });
        },
        setMetric2: (metric2Obj) => {
            this.setState({
                metric2: metric2Obj
            });
        },
        setTime : (timeObj) => {
            this.setState({
                time: timeObj
            });
        },
        setErrorFlag : (value) => {
            this.setState({
                errorFlag: value
            });
        }
    }

    // Pass this down to give lower components access to overall state
    getState = () => {
        return this.state;
    }
    
    handleNext = () => {
        let stepIndex = this.state.stepIndex;
        let nextStep = stepIndex + 1;
        // Do not allow problematic queries to send.
        if (this.state.errorFlag === true && nextStep === 4) {
            // Blocked! Need a proper error message.
            return null;
        }
        if (nextStep <= 4) {
            this.setState({
                stepIndex: nextStep
            });
        }
    };

    handlePrev = () => {
        let stepIndex = this.state.stepIndex;
        let nextStep = stepIndex - 1;
        // Prevent user from walking off the beginning
        if (nextStep >= 0) {
            this.setState({stepIndex: nextStep});
        }
    };

    render() {
        const {stepIndex} = this.state;
        return (
            <div>
                <Paper style={style} zDepth={2} className="mainView">
                    <AppBar 
                        title="GCTools Data App"
                        style={titleStyle}
                        iconElementRight={<img src={GCTools} alt="GCTools logo" className="gclogo"/>}
                    />
                    <Steps index={stepIndex}/>
                    <ContentBox currBox={stepIndex} setters={this.setters} superState={this.getState}/>
                    <FlatButton style={backButtonStyle}
                        label="Back"
                        onClick={this.handlePrev}
                    />
                    <RaisedButton style={nextButtonStyle}
                        label={'Next'}
                        onClick={this.handleNext}
                        primary={true}
                    />
                </Paper>
            </div>
        );
    }
}

export default MainView;