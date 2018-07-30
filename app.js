var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require('path');
var os = require('os');
var spawn = require('child_process').spawn
var browserDetector = require('./browser-detector.js');

var app = express();
var PORT = 2112;

// Write all incoming requests to the terminal
app.use("*", (req, res, next) => {
    console.log(req.originalUrl);
    next();
});

app.use(express.static(path.join(__dirname, 'build'), {
    index: false,
    maxage: '1s'
}));

// Route for data requests
app.use( bodyParser.json() );
app.post('/api', (req, res) => {
    var py;
    var dataString = '';
    console.log('Data request received!');
    console.log(JSON.stringify(req.body));

    // Account for containerized & non-containerized environment
    pyName = (os.platform() === 'win32' ? 'python' : 'python3');
    py = spawn(pyName, ['data_fetch.py']);

    // Start the python process
    dataString = '';

    // Handle incoming data from Python
    py.stdout.on('data', function(data) {
        console.log('receiving data from python...');
        dataString += data.toString();
    });

    // Handle end of Python data
    py.stdout.on('end', () => {
        // Send the response straight to client
        console.log('response from python: ' + dataString);
        res.send(dataString);
    });

    // Send out the request data to Python
    py.stdin.write(JSON.stringify(req.body));
    // Stop writing and wait for a response
    py.stdin.end();
});

// Prod server
app.get('/', (req, res) => {
    // Serve light version for non-modern browsers
    br = browserDetector.detect(req.headers['user-agent']);
    if (br === 'noMatch' || br === 'edge')
        res.sendFile(path.join(__dirname, 'build', 'lowfi-app.html'));
    else
        res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT);

console.log('Server listening on port ' + PORT);