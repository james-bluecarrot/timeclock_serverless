import * as path from 'path';
import * as firebase from 'firebase';

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
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}

function initFirebase() {
    try {
        firebase.initializeApp(credentials);
    } catch(err) {
        let randomNameGenerator = randomString(9);
        firebase.initializeApp(credentials, randomNameGenerator);
    }
}

export function sendreport(event, context, cb) {
    initFirebase();
    let db = firebase.database();
    let ref = db.ref('logging');
    ref.once('value', (snapshot) => {
        console.log(snapshot.val());
        cb(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event, test: snapshot.val() });
    });
}