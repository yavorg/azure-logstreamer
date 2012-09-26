/**
 * Module dependencies.
 */
var request = require('request'),
    url = require('url'),
    util = require('util'),
    tty = require('tty');


/**
 * azure-cli-site-log-tail:
 *
 * A plugin for the azure command-line tool that enables it to 
 * access the /streamedlog endpoint exposed by the azure-logstreamer
 * connect middleware and see the server log entries in your console 
 * window in real time. 
 *
 * Examples:
 *
 *   To use this plugin, we need to follow the azure command-line
 *   tool extensibility model. First install the azure tool via npm 
 *   by running npm install azure -g. Then install this module with 
 *   the -g flag as well. You will then see this new command in the 
 *   azure tool. 
 *
 *     azure site log tail [name]
 * 
 * @param {Object} the azure cli object
 * @api public
 */
module.exports = function (cli) {
	var log = cli.output;
	var site = cli.category('site');
	
	site.category('log').command('tail [name]')
	.whiteListPowershell()
	.description('Stream diagnostic log entries to console output')
	.option('-s, --subscription <id>', 'use the subscription id')
	.execute(function (name, options, callback) {
		var context = {
		    subscription: cli.category('account').lookupSubscriptionId(options.subscription),
		    site: {
		      name: name
		    }
		};

		site.lookupSiteNameAndWebSpace(context, function lookedUp(error1, cache){
			if(error1){
				callback(error1);
			}

			var siteData = null;
			if(!cache){
				site.doSiteGet(context, function gotSite(error2, data){
					if(error2){
						callback(error2);
					}
					siteData = clean(data);
					siteDataReady();
				});				
			} else {
				siteData = clean(cache);
				siteDataReady(); 
			}

			function siteDataReady(){
				var requestOptions = getDefaultOptions();
				requestOptions.url = 'http://' + toArray(siteData.HostNames)[0] + '/streamedlog';
				
				log.info('Streaming website logs, ^C to quit')
				var stream = request(requestOptions);
				stream.on('data', function(data){
			  		log.data(data);
			  	});

			  	// Hack to catch CTRL + C and work around this bug
			  	// https://github.com/joyent/node/issues/1553
				process.stdin.resume();
				tty.setRawMode(true);

				process.stdin.on('keypress', function(char, key) {
				  if (key && key.ctrl && key.name == 'c') {
				    callback();
				  }
				});
			}
		});
	});
	
};

function toArray(testObject) {
	return isArray(testObject) ? testObject : typeof testObject === 'undefined' ? [] : [testObject];
}

 function isArray(testObject) {
	return testObject && !(testObject.propertyIsEnumerable('length')) && typeof testObject === 'object' && typeof testObject.length === 'number';
}

function getDefaultOptions() {
	var options = {};
	var proxy = null;
	var proxyVars = ['HTTP_PROXY', 'HTTPS_PROXY', 'ALL_PROXY'];

	proxyVars.forEach(function(item){
		if(process.env[item]){
			proxy = process.env[item];
		} else if (process.env[item.toLowerCase()]){
			proxy = process.env[item.toLowerCase()];
		}
	});

	if (proxy) {
		var proxyUrl = url.parse(proxy);
		if (proxyUrl.protocol !== 'http:' &&
            proxyUrl.protocol !== 'https:') {
            // fall-back parsing support XXX_PROXY=host:port environment variable values
        	proxyUrl = url.parse('http://' + proxy);
  		}
  		if (!proxyUrl.port) {
	    	parsedUrl.port = /https/i.test(proxyUrl.protocol) ? 443 : 80
	    }

	    options.proxy = proxyUrl;
	}

	return options;
}

function clean(source) {
    if (typeof (source) === 'string') {
      return source;
    }

    var target = {};
    var hasString = false;
    var hasNonString = false;
    var stringValue = '';

    for (var prop in source) {
      if (prop == '@') {
        continue;
      } else {
        if (prop === '#' || prop === 'string' || prop.substring(prop.length - 7) === ':string') {
          hasString = true;
          stringValue = source[prop];
        } else {
          hasNonString = true;
        }
        target[prop] = clean(source[prop]);
      }
    }
    if (hasString && !hasNonString) {
      return stringValue;
    }
    return target;
}