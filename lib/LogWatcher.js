var fs = require('fs'),
    util = require('util'),
    events = require('events');
    
function LogWatcher(logFolder) {
    if(false === (this instanceof LogWatcher)) {
        return new LogWatcher(logFolder);
    }
    
    events.EventEmitter.call(this);

    var self = this;
    watchFolder(logFolder, 
      function dataAvailable(error, data) {
            if(!error){
                  self.emit('data', data);
            }
      });

}
util.inherits(LogWatcher, events.EventEmitter);
module.exports = LogWatcher;

function parseFileName(filename)
{
      var result = null;
      var length = filename && filename.length || 0;
      var fileExtensionIndex = length - 4;

      if(length > 4 && filename.substring(fileExtensionIndex) === '.txt'){
            var parts = filename
            .substring(0, fileExtensionIndex)
            .split('-');

            if(parts.length === 4){
                  result = {
                        machineName: parts[0],
                        pid: parseInt(parts[1]),
                        buffer: parts[2],
                        timeStamp: parseInt(parts[3])
                  };
            }

      }
      return result;
}

function watchFolder(folder, callback){
      var logFileSizes = [];
      fs.watch(folder, {persistent: true}, 
            function fileChanged(event, filename){
                  var file = parseFileName(filename);
                  filename = folder + filename;

                  if(file && (event === 'rename' || event === 'change')){
                        fs.stat(filename, function gotStats(e, stats){
                              var size = stats.size || 0;
                              if(!logFileSizes[filename]){
                                logFileSizes[filename] = size;
                              }
                              var offset = logFileSizes[filename];
                              

                              // If the file changed in size
                              if(offset !== size && size > offset){
                                    var readStream = fs.createReadStream(filename, {
                                          flags: 'r', 
                                          encoding: 'ascii', 
                                          start: offset,
                                          end: size
                                    });
                                    readStream.on('data', function haveData(data){ 
                                          callback(null, {
                                            machineName: file.machineName,
                                            pid: file.pid,
                                            buffer: file.buffer,
                                            timeStamp: Date.now(),
                                            message: data.trim()
                                          });
                                    });

                                    logFileSizes[filename] = size;
                              }      
                        });
                  }
            });
}