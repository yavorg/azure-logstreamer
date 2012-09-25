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
    var validity = 9000; // 9 seconds

    var options = {
        wait: Number.MAX_VALUE,
        stale: validity + 1000
    };

    var lockHandler = function(error, handle){
        if(!error){
            // Need to do something to handle for the file to actually be created
            fs.write(handle, 'lock', null, null, function(){
                self.emit('locked'); 
                setTimeout(function(){
                    lockfile.unlock(file, function(error2){
                        if(!error2){
                            self.emit('unlocked');
                            lockfile.lock(file, options, lockHandler);
                        } else { 
                            console.log(JSON.stringify(error2));
                        }
                    });
                }, validity);
            });
        } else { 
            console.log(JSON.stringify(error));
        }
    };

    lockfile.lock(file, options, lockHandler);
}

util.inherits(DistributedLock, events.EventEmitter);
module.exports = DistributedLock;

