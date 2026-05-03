const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "dhanyaa@2006",  // ✅ Fixed: use same password as server.js
    database: "edoc"
});

db.connect(function(err){
    if(err){
        console.error("❌ Database connection failed:", err.message);
    } else {
        console.log("✅ Connected to MySQL");
    }
});

module.exports = db;
