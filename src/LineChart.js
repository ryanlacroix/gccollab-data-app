import React, {Component} from 'react';
import * as d3 from 'd3';

import './LineChart.css';

class LineChart extends Component {
   
    constructor(props) {
        super(props);
        this.createLineChart = this.createLineChart.bind(this);
        this.state = {
            dat: {} // Placeholder for data
        }
    }
    componentDidMount() {
        this.prepareLineChart();
    }
    
    prepareLineChart() {
        var reader = new FileReader();
        reader.onload = () => {
            let datObj = d3.tsvParse(reader.result);
            this.setState({
                dat: datObj
            }, () => {
                // Create the chart after data is loaded
                this.createLineChart();
            });
        }
        fetch('/getData', {
            method: 'post',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(this.props.superState())
        }).then(response => {
            return response.blob();
        }).then(respObj => {
            reader.readAsText(respObj);
        });
    }

    createLineChart() {
        // Grab the DOM reference to this
        const node = this.node,
        margin = {top: 20, right: 30, bottom: 30, left: 20},
        width = d3.select(node).attr("width") - margin.left - margin.right,
        height = d3.select(node).attr("height") - margin.top - margin.bottom;

        // Helper function for formatting incoming data
        function type(d, _, columns) {
            d.date = parseTime(d.date);
            for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
            return d;
        }

        var g = d3.select(node)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        
        var parseTime = d3.timeParse("%Y%m%d");
        var x = d3.scaleTime().range([0, width]),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);

        var line = d3.line()
            .curve(d3.curveBasis)
            .x(function(d) { return x(d.date); })
            .y(function(d) { return y(d.temperature); });
        
        
        var data = this.state.dat;
        let cols = data.columns;
        // Run type function to format the data correctly
        data = data.map(function(d) {
            return type(d,0,data.columns);
        });
        data.columns = cols;
        var cities = data.columns.slice(1).map(function(id) {
            return {
                id: id,
                values: data.map(function(d) {
                    return {date: d.date, temperature: d[id]};
                })
            };
        });

        x.domain(d3.extent(data, function(d) { return d.date; }));

        y.domain([
            d3.min(cities, function(c) { return d3.min(c.values, function(d) { return d.temperature; }); }),
            d3.max(cities, function(c) { return d3.max(c.values, function(d) { return d.temperature; }); })
        ]);

        z.domain(cities.map(function(c) { return c.id; }));

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Temperature, ºF");

        var city = g.selectAll(".city")
            .data(cities)
            .enter().append("g")
            .attr("class", "city");

        city.append("path")
            .attr("class", "line")
            .attr("d", function(d) { return line(d.values); })
            .style("stroke", function(d) { return z(d.id); });

        city.append("text")
            .datum(function(d) { return {id: d.id, value: d.values[d.values.length - 1]}; })
            .attr("transform", function(d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .text(function(d) { return d.id; });
        
            
    }
    
    render() {
        return (
            <div>
                <svg className="currGraph" ref={node => this.node = node}
                    width={this.props.w} height={this.props.h} />
            </div>
        );
    }
}

export default LineChart;
/* <CurrBox className="content" setters={this.props.setters} superState={this.props.superState}/> */