import * as path from 'path';
import * as firebase from 'firebase';

let SparkPost = require('sparkpost');
let sp = new SparkPost('3fd0a73c196a3e1d67ccb4e38b83d42ee64c5385');

function sendEmail(content: Object, email: string) {
    content['from'] = 'Time Clock App <testing@sparkpostbox.com>';
    return new Promise<boolean>((resolve, reject) => {
        sp.transmissions.send({
            transmissionBody: {
                content: content,
                recipients: [
                    { address: email ? email : 'timesheet@bluecarrot.co.nz' }
                ]
            }
        }, (err, res) => {
            if (err) {
                reject(err);
            } else {
                console.log('Email Sent to ', email || 'timesheet@bluecarrot.co.nz' );
                resolve(true);
            }
        });
    })
}

let credentials = {
    apiKey: "AIzaSyDI59kJ3nvFKbvvoctZuyk3IwoYuulzfwQ",
    authDomain: "timeclock-app.firebaseapp.com",
    databaseURL: "https://timeclock-app.firebaseio.com",
    // serviceAccount: path.resolve(__dirname, './config/TimeClock App-fb5eb2d6e36b.json')
};

function randomString(len, charSet?) {
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
    } catch (err) {
        let randomNameGenerator = randomString(9);
        firebase.initializeApp(credentials, randomNameGenerator);
    }
}

function getTimeStamp(now) {
    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
        now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds());
}

export function sendreport(event, context, cb) {
    initFirebase();
    let db = firebase.database();
    let ref = db.ref('logging');
    let ref2 = db.ref('users');
    let users = [];
    let data = [];
    let startDate = event.body && event.body.startDate ? new Date(event.body.startDate) : new Date();
    let endDate = event.body && event.body.endDate ? new Date(event.body.endDate) : new Date();
    if(!event.body || !event.body.startDate) startDate.setDate(startDate.getDate() - 7);
    console.log(startDate.toUTCString(), endDate.toUTCString()) 
    ref2.once('value', function (snap) {
        users = snap.val();
        ref.orderByChild('timestamp/TIMESTAMP')
            .startAt(getTimeStamp(startDate))
            .endAt(getTimeStamp(endDate))
            .once("value", function (snapshot) {
                console.log('snapshot', snapshot.val())
                let logs = snapshot.val() || {};
                Object.keys(logs).map(key => {
                    let log = logs[key];
                    let ts = log.timestamp.TIMESTAMP;
                    let date = new Date(ts);
                    let [user] = users.filter(user => user.email === log.user.email);
                    if (user) {
                        // 31 2011 03 11 0800 00000000000123 0000000000000000000000000000000000
                        let value = `31${date.getUTCFullYear()}${date.getUTCMonth()}${date.getUTCDay()}${date.getUTCHours()}${date.getUTCMinutes()}0000${user['code']}0000000000000000000000000000000000`;
                        data.push(value);
                    }
                });
                if (Object.keys(logs).length > 0) {
                    let text = data.join('\n');
                    let content = {
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
                                "data": new Buffer(text,'base64').toString()
                            }
                        ]
                    };
                    sendEmail(content, event.body && event.body.email).then(res => {
                        // cb(null, 'Email sent successfull!' );
                        context.succeed('Email sent successfull!')
                    }).catch(err => {
                        context.fail(JSON.stringify(err));
                    });
                } else {
                    // cb(null, 'No logs found!');
                    context.fail('No logs found!')
                }
            });
    });
}