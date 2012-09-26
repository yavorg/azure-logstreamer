azure-logstreamer
=============

This projects enables better logging for Windows Azure Websites written in Node.js. The
project consists of:
* A connect middleware piece for Node.js apps, which lets you stream the 
console output of your app over a /streamedlog endpoint via a HTTP chunked response. Optionally
this middleware will also store your logs in Azure table storage for safe keeping.
* A plugin for the azure command-line tool that enables it to access the /streamedlog endpoint 
and see the server log entries in your console window in real time. 

Setup
-------

To set up the connect middleware, first install it via npm.

```bash
npm install https://github.com/yavorg/azure-logstreamer/tarball/master
```

Then, add this one line to your connect app. Azure table storage credentials can be 
passed to the method to enable storing the logs permanently.

```javascript
connect().use(require('azure-logstreamer')());
```

To receive the log output in your console window, first install the azure command-line tool
using npm, and then install the plugin from this repo. 

```bash
npm install azure -g
npm install https://github.com/yavorg/azure-logstreamer/tarball/master -g
```

This will add an extra option to the azure tool.

```bash
azure site log tail [name]
```

Demo
------------

Here is a video demo showing the final experience.

<iframe src="http://player.vimeo.com/video/50185987" width="500" height="375" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe> <p><a href="http://vimeo.com/50185987">azure-logstreamer demo</a> from <a href="http://vimeo.com/yavorgeorgiev">Yavor Georgiev</a> on <a href="http://vimeo.com">Vimeo</a>.</p>