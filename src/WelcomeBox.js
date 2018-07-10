import React, {Component} from 'react';

import './WelcomeBox.css';

class WelcomeBox extends Component {

    render() {
        return (
            <div>
                <p className="box-content">
                    Welcome to the GCTools self-serve data app. This wizard will guide you through the process of requesting data. Click Next to continue.
                </p>
            </div> 
        );
    }
}

export default WelcomeBox;