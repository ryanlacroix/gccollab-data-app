import React, {Component} from 'react';
import HotTable from 'react-handsontable';

import './DataTable.css';

class DataTable extends Component {
    /* Call each time step changes. Inserts correct component accordingly*/
    constructor(props) {
        super(props);
    }

    componentWillReceiveProps(nextProps, nextContext) {
        this.setState({data: nextProps.data })
    }

    render() {
        let sz = { height: 200, width: '50%' };
        let height = 'auto';
        let overflow = 'visible';
        //if (this.props.size !== null) {
        if (this.props.data.length > 10) {
            // Table is oversize
            height = sz.height;
            overflow = 'auto';
        }
        return (
            <div style={{width: '500px', overflow: 'auto', height:'200px', float: 'right'}}> 
                <HotTable
                    data={this.props.data}
                    contextMenu={true}
                    modifyColWidth={ (width, col) => {
                        if(width > 250)
                            return 250;
                    }}
                    wordWrap={false}
                    stretchH={'all'}
                    stretchV={'all'}
                    colHeaders={this.props.headers}
                    rowHeaders={false}
                    renderAllRows={true}
                    
                    
                />
            </div>
        );
    }
}

export default DataTable;
/*
borderBottom: '20px'
margin: '0 auto', 
modifyColWidth={ (width, col) => {
                        if(width > 300)
                            return 300;
                    }}

                    colHeaders={true}
style={{overflow: 'hidden'}}
*/