const mysql      = require('mysql');

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'root',
  database : 'pumpkin'
});

connection.connect(function(err) {
    if (err) {
        console.error('Error Connecting: ' + err.stack);
        process.exit(1);
    }
    console.log(`MYSQL connected: ${connection.config.user}@${connection.config.host}:${connection.config.port}, thread ID: ${connection.threadId}`);
});

module.exports = connection;
