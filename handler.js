"use strict";
function hello(event, context, cb) {
    cb(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event: event });
}
exports.hello = hello;
