/**
 * Module dependencies.
 */
var fs = require('fs'),
    azure = require('azure'),
    util = require('util'),
    uuid = require('node-uuid'),
    LogWatcher = require('./LogWatcher'),
    DistributedLock = require('./DistributedLock');

/**
 * azure-logstreamer:
 *
 * A connect middleware piece for Node.js apps hosted
 * in Windows Azure Websites. This middleware lets you stream the 
 * console output of your app over a /streamedlog endpoint off 
 * via a HTTP chunked response. 
 * 
 * If the optional storageAccount parameter is passed, azure-logstreamer
 * will also store your logs in Azure table storage for safe keeping.
 *
 * Examples:
 *
 *   Just stream logs over HTTP /streamedlog endpoint
 *
 *     connect()
 *      .use(connect.azure-logstreamer())
 * 
 * @param {Object} optional Azure table storage account settings 
 * with 'name' and 'accessKey' properties
 * @return {Function} the request handler
 * @api public
 */

module.exports = function(storageAccount){
  var logFilesPath = '../../LogFiles/nodejs/';
  
  var watcher = new LogWatcher(logFilesPath);
  // Node defaults to 10 listeners per event, 0 makes it infinite.
  // For now let's keep it at 100 to watch for leaks, but in production
  // needs to go to 0.
  watcher.setMaxListeners(100);

  if(storageAccount &&
    storageAccount.name &&
    storageAccount.accessKey){

    var writeToTable = false;    
    var tableService = null;
    var tableName = 'WADLogsTable';

    var lock = new DistributedLock(logFilesPath + 'tableStorageCopy.lock');
    lock.on('locked', function acquiredLock(){
      tableService = azure.createTableService(
        storageAccount.name, storageAccount.accessKey);
      tableService.createTableIfNotExists(tableName,
        function tableCreated(error){
          if(!error){
           writeToTable = true;
          }
        });
    });

    watcher.on('data', function dataAvailable(data){
      if(writeToTable){
        tableService.insertEntity(tableName, 
          createLogEntryEntity(data));
      }
    });
  }

  return function streamLog(req, res, next){
    if ('/streamedlog' == req.url &&
        req.method === 'GET') {

        res.writeHead(200, { 'Content-Type': 'text/plain'} );

        var callback = function dataAvailable(data){
           var formatted = util.format('[%s][%d][%s][%d] %s',
            data.machineName, data.pid, data.buffer,
            data.timeStamp, data.message);
           res.write(formatted);
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

function createLogEntryEntity(data){
  var timeStamp = new Date(data.timeStamp);
  var timeStampMinutePrecision = 
  new Date(timeStamp.getUTCFullYear(),
    timeStamp.getUTCMonth(),
    timeStamp.getUTCDay(),
    timeStamp.getUTCHours(),
    timeStamp.getUTCMinutes());

  // This is slightly hacky as it realies on a WAWS
  // implementation detail to get the site name
  var siteName = process.env.APP_POOL_ID || 'Unknown site';

  // Convert to .NET-style ticks
  function ticksSinceYearZero(ticks){
    return ticks * 10000 + 621355968000000000;
  }

  return {
    PartitionKey: '0' + ticksSinceYearZero(timeStampMinutePrecision.getTime()),
    RowKey: util.format('%s___%s___%s___%s', siteName, data.machineName, data.pid, uuid.v4()),
    EventId: 0,
    DeploymentId: '', // We don't have a way to get this
    Role: siteName, // Use the role name for the site name
    RoleInstance: data.machineName, // Use the role instance for the machine name
    Level: (data.buffer === 'stderr') ? 2: 4, 
    Timestamp: timeStamp,
    EventTickCount: ticksSinceYearZero(data.timeStamp),
    Pid: data.pid,
    Tid: 1,
    Message: data.message
  };
}
