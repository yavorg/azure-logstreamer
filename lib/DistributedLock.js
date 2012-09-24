var fs = require('fs'),
    util = require('util'),
    events = require('events'),
    lock = require('lockfile');
    
function DistributedLock(file) {
    if(false === (this instanceof DistributedLock)) {
        return new DistributedLock(file);
    }
    
    events.EventEmitter.call(this);

    var options = {
        // If lock is unavailable, wait unit it is
        wait: Number.MAX_VALUE
    };
    lockfile.lock(file, options, function(error, file){
      if(!error){
        self.emit('locked');
      }
    });
  }
  
util.inherits(DistributedLock, events.EventEmitter);
module.exports = DistributedLock;

