"use strict";
var firebase = require('firebase');
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
function sendreport(event, context, cb) {
    initFirebase();
    var db = firebase.database();
    var ref = db.ref('logging');
    ref.once('value', function (snapshot) {
        console.log(snapshot.val());
        cb(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event: event, test: snapshot.val() });
    });
}
exports.sendreport = sendreport;
