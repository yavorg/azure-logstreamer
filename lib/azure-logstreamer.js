/**
 * Module dependencies.
 */
var fs = require('fs'),
    LogWatcher = require('./LogWatcher');

/**
 * azure-logstreamer:
 *
 * A connect middleware piece for Node.js apps hosted
 * in Windows Azure Websites. This middleware lets you stream the 
 * console output of your app over a /streamedlog endpoint off 
 * via a HTTP chunked response. 
 *
 * Examples:
 *
 *   Just stream logs over HTTP /streamedlog endpoint
 *
 *     connect()
 *      .use(connect.azure-logstreamer())
 *
 * @return {Function} the request handler
 * @api public
 */

module.exports = function(){
  var watcher = new LogWatcher();
  // Node defaults to 10 listeners per event, 0 makes it infinite.
  // For now let's keep it at 10 to watch for leaks, but in production
  // needs to go to 0.
  // watcher.setMaxListeners(0);

  return function streamLog(req, res, next){
    if ('/streamedlog' == req.url &&
        req.method === 'GET') {

        res.writeHead(200, { 'Content-Type': 'text/plain'} );

        var callback = function dataAvailable(data){
            res.write(data);
        };
        watcher.on('data', callback);

        // Clean up listeners when users terminate connection
        req.on('close', function(){
          watcher.removeListener('data', callback);
        });

    } else {
      next();
    }
  };
};

