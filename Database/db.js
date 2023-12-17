var sqlite3 = require('sqlite3').verbose();
var dbPath = `${__dirname}/db.db`;

let db = new sqlite3.Database(dbPath/*dbPath*/, sqlite3.OPEN_READWRITE, (err) => {
    try {
        if (err) {
            console.error(err.message);
        } else {
            console.log('DATABASE 연동 성공!');

        }
    } catch(err) {
        console.log(err)
    }
}); 

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'User', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE User (enrollment_token, token, name, registration, address, Date_created, area, img_link, date, expiration_date)')
            console.log("User 테이블 생성")
        } catch(err) {        

        }
    }
})

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'Admin', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE Admin (token, id, role)')
            console.log("Admin 테이블 생성")
        } catch(err) {        

        }
    }
})

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, 'Server', (err, row) => {
    if(!row) {
        try {
            db.run('CREATE TABLE Server (Notice)')
            console.log("Server 테이블 생성")
        } catch(err) {        

        }
    }
})

module.exports = {
    db,
}