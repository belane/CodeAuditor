const fs = require('fs');
const db = require('./mysql/connection.js');


function contentRead(req: any, res: any) {
    const reqPath = __dirname + req.query.filename;
    let data = fs.readFileSync(reqPath, { encoding: 'utf8', flag: 'r' });
}

function sssss(req: any, res: any) {
    var name = req.query.name;
    var password = crypto.createHash('sha256').update(req.query.password).digest('base64');

    var sql = "select * from user where name = '" + name + "' and password = '" + password + "'";

    db.query(sql, function (err: any, result: any) {
        return;
    })
}
