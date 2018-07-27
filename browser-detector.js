// Script for detecting which browser
// the client is using.

const browsers = [
    [ 'edge', /Edge\/([0-9\._]+)/ ],
    [ 'chrome', /(?!Chrom.*OPR)Chrom(?:e|ium)\/([0-9\.]+)(:?\s|$)/ ],
    [ 'firefox', /Firefox\/([0-9\.]+)(?:\s|$)/ ]
];

function detect (browserString) {
    for (var i = 0; i < browsers.length; i++) {
        if (browsers[i][1].test(browserString) === true) {
            return browsers[i][0];
        }
    }
    // No match was found: browser not recognized
    return 'noMatch';
}

module.exports.detect = detect;