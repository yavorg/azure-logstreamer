var http = require('http'),
    connect = require('connect'),
    logstreamer = require('azure-logstreamer');


var app = connect()
  .use(logstreamer())
  .use(function(req, res){
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('Hello from Connect!\n');
  });

setInterval(function writeToLog(){
      console.log(new Date().toString() + '\r\n');
}, 5000);

http.createServer(app).listen(process.env.port || 8000, 'localhost');
