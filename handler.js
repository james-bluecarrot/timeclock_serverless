"use strict";
var fs = require('fs');
var firebase = require('firebase');
var moment = require('moment');
var SparkPost = require('sparkpost');
var sp = new SparkPost('3fd0a73c196a3e1d67ccb4e38b83d42ee64c5385');
function sendEmail(content, email) {
    content['from'] = 'Time Clock App <testing@sparkpostbox.com>';
    return new Promise(function (resolve, reject) {
        sp.transmissions.send({
            transmissionBody: {
                content: content,
                recipients: [
                    { address: email ? email : 'timesheet@bluecarrot.co.nz' }
                ]
            }
        }, function (err, res) {
            if (err) {
                reject(err);
            }
            else {
                console.log('Email Sent to ', email || 'timesheet@bluecarrot.co.nz');
                resolve(true);
            }
        });
    });
}
var credentials = {
    apiKey: "AIzaSyDI59kJ3nvFKbvvoctZuyk3IwoYuulzfwQ",
    authDomain: "timeclock-app.firebaseapp.com",
    databaseURL: "https://timeclock-app.firebaseio.com",
};
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
    var randomString = '';
    for (var i = 0; i < len; i++) {
        var randomPoz = Math.floor(Math.random() * charSet.length);
        randomString += charSet.substring(randomPoz, randomPoz + 1);
    }
    return randomString;
}
function initFirebase() {
    try {
        firebase.initializeApp(credentials);
    }
    catch (err) {
        var randomNameGenerator = randomString(9);
        firebase.initializeApp(credentials, randomNameGenerator);
    }
}
function getTimeStamp(now) {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
}
function sendreport(event, context, cb) {
    initFirebase();
    var db = firebase.database();
    var ref = db.ref('logging');
    var ref2 = db.ref('users');
    var users = [];
    var data = [];
    console.log('event state date', event.body.startDate);
    console.log('event end date', event.body.endDate);
    var startDate = event.body && event.body.startDate ? new Date(event.body.startDate) : new Date();
    var endDate = event.body && event.body.endDate ? new Date(event.body.endDate) : new Date();
    if (!event.body || !event.body.startDate)
        startDate.setDate(startDate.getDate() - 7);
    console.log('Date', startDate.toUTCString(), endDate.toUTCString());
    console.log('Timestamp', getTimeStamp(startDate), getTimeStamp(endDate));
    ref2.once('value', function (snap) {
        users = snap.val();
        ref.orderByChild('timestamp/TIMESTAMP')
            .startAt(getTimeStamp(startDate))
            .endAt(getTimeStamp(endDate))
            .once("value", function (snapshot) {
            console.log('snapshot', snapshot.val());
            var logs = snapshot.val() || {};
            Object.keys(logs).map(function (key) {
                var log = logs[key];
                var ts = log.timestamp.TIMESTAMP;
                // let date = new Date(ts);
                var date = moment(ts).utcOffset('+13:00');
                console.log('date', date.year() + "-" + (date.month() + 1) + "-" + date.date() + " " + date.hour() + ":" + date.minute());
                var user = users.filter(function (user) { return user.email === log.user.email; })[0];
                if (user) {
                    // 31 2011 03 11 0800 00000000000123 0000000000000000000000000000000000
                    var value = "31" + date.year() + (date.month() + 1) + date.date() + date.hour() + date.minute() + "0000" + user['code'] + "0000000000000000000000000000000000";
                    data.push(value);
                }
            });
            if (Object.keys(logs).length > 0) {
                var text = data.join('\n');
                fs.writeFileSync('/tmp/timesheet.txt', text);
                var file = fs.readFileSync('/tmp/timesheet.txt');
                var content = {
                    subject: 'Timesheet!',
                    html: '<html><body><p>' +
                        'Hey,' +
                        '<br /><br />' +
                        'Please find attached Timesheet from ' + startDate.toUTCString() + ' to ' + endDate.toUTCString() + '.' +
                        '<br /><br />' +
                        'Regards,' +
                        '<br />' +
                        'Time Clock App' +
                        '</p></body></html>',
                    "attachments": [
                        {
                            "type": "text/plain; charset=UTF‐8",
                            "name": "timesheet.daf",
                            "data": file.toString('base64')
                        }
                    ]
                };
                sendEmail(content, event.body && event.body.email).then(function (res) {
                    // cb(null, 'Email sent successfull!' );
                    context.succeed('Email sent successfull!');
                }).catch(function (err) {
                    context.fail(JSON.stringify(err));
                });
            }
            else {
                // cb(null, 'No logs found!');
                context.fail('No logs found!');
            }
        });
    });
}
exports.sendreport = sendreport;
