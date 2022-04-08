import * as fs from "fs";
import * as crypto from "crypto";
const db = require('./mysql/connection.js');


function contentRead(req: any, res: any) {
    const reqPath = __dirname + req.query.filename;
    const data = fs.readFileSync(reqPath, { encoding: 'utf8', flag: 'r' });
}

function login(req: any, res: any) {
    const name = req.query.name;
    const password = crypto.createHash('sha256').update(req.query.password).digest('base64');
    const sql = "select * from user where name = '" + name + "' and password = '" + password + "'";

    db.query(sql, function (err: any, result: any) {
        return;
    });
}
