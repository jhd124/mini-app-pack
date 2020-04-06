const Client  = require("./userModule2")
module.exports = {
    p: "property",
}

exports.userModule1SomeVar = "userModule1SomeVar"

function ensureInt(a){
    return parseInt(a);
}

export function sum (a, b){
    return ensureInt(a) + ensureInt(b);
}

new Client();