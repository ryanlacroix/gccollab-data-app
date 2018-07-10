import React, { Component } from 'react';
import C3Chart from 'react-c3js';
import 'c3/c3.css';

import './DonutChart.css';

class DonutChart extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {
                columns: [
                    ['temp1'],
                    ['temp2']
                ],
                type: 'donut'
            }
        }
    }

    // This might be due for removal
    temp = () => {
        //let state = this.props.superState();
        fetch('/getData2', {
            method: 'POST',
            mode: 'cors',
            cache: 'default',
            body: JSON.stringify({'temp':'tempp'}),
            headers: {
                "Content-Type": "application/json"
            }
            //body: {temp:'temp'}
        }).then(response => {
            return response.json();
        }).then(data => {
            this.setState({
                data: {
                    columns: data.columns,
                    type: 'donut'
                }
            });
        });
    }

    componentDidMount() {
        let state = this.props.superState();
        fetch('/getData/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(state)
        }).then(response => {
            return response.json();
        }).then(data => {
            // Munge incoming data into shape
            let dataArr = [];
            for (let i=0;i<data.top_deps[0].length;i++) {
                // Remove second half of name for now (space reasons)
                let depName = data.top_deps[0][i].substring(0,
                    data.top_deps[0][i].indexOf('/') );
                dataArr.push([depName, data.top_deps[1][i]]);
            }
            this.setState({
                data: {
                    columns: dataArr,
                    type: 'donut'
                }
            });
        });
    }

    render() {
        const data = {
            columns: [
                ['data1'],
                ['data2']
            ],
            type: 'donut'
        };
        let sz = { height: 200, width: 500 };
        return (
            <div>
                <p> {this.props.title} </p>
                <C3Chart data={this.state.data} donut={{label: {format: function(value) { return value;}}}} legend={{position: 'right'}} size={sz} unloadBeforeLoad={true} />
            </div>
        )
    }
}

export default DonutChart;

//<C3Chart data={this.state.data} donut={{label: {format: function(value) { return value;}}}} legend={{position: 'right'}} size={sz} unloadBeforeLoad={true} />
