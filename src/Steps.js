import React, {Component} from 'react';
import {Step, Stepper, StepLabel} from 'material-ui/Stepper';

import './Steps.css';


class Steps extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    getStepContent(stepIndex) {
        switch(stepIndex) {
            case 1:
                return 'placeholder 1';
            case 2:
                return 'placeholder 2';
            case 3:
                return 'placeholder 3';
            case 4:
                return 'placeholder 4';
            case 5:
                return 'placeholder 5';
        }   
    }

    render() {
        return (
            <div>
                <Stepper activeStep={this.props.index}>
                    <Step>
                        <StepLabel>Welcome</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Type</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Metric</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Time</StepLabel>
                    </Step>
                    <Step>
                        <StepLabel>Done</StepLabel>
                    </Step>
                </Stepper>
            </div>
        );
    }
}

export default Steps;