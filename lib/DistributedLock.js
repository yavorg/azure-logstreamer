var fs = require('fs'),
    util = require('util'),
    events = require('events'),
    lockfile = require('lockfile');
    
function DistributedLock(file) {
    if(false === (this instanceof DistributedLock)) {
        return new DistributedLock(file);
    }
    
    events.EventEmitter.call(this);

    var self = this;

    var options = {
        wait: Number.MAX_VALUE
    };
    lockfile.lock(file, function(error, handle){
      if(!error){
        // Need to do something to fd for the file to actually be created
        fs.write(handle, 'lock', null, null, function(){
            self.emit('locked');
        });
      } else {
        throw error;
      }
    });
  }

util.inherits(DistributedLock, events.EventEmitter);
module.exports = DistributedLock;

