var path       = require('path');
var fs         = require('fs');
var util       = require('util');
var Writer     = require('broccoli-writer');
var Handlebars = require('handlebars');
var walkSync   = require('walk-sync');
var RSVP       = require('rsvp');
var helpers    = require('broccoli-kitchen-sink-helpers');
var mkdirp     = require('mkdirp');
var Promise    = RSVP.Promise;

var getKey = function (str) {
  return path.basename(str, path.extname(str));
};

var HandlebarsWriter = function (inputTree, files, options) {
  if (!(this instanceof HandlebarsWriter)) {
    return new HandlebarsWriter(inputTree, files, options);
  }

  this.inputTree = inputTree;
  this.files = files;

  this.options = options || {};
  this.context = this.options.context || {};
  this.destFile = this.options.destFile || function (filename) {
    return filename.replace(/(hbs|handlebars)$/, 'html');
  };
  this.handlebars = this.options.handlebars || Handlebars;

  this.loadPartials();
  this.loadHelpers();
};

HandlebarsWriter.prototype = Object.create(Writer.prototype);
HandlebarsWriter.prototype.constructor = HandlebarsWriter;

HandlebarsWriter.prototype.loadHelpers = function () {
  var helpers = this.options.helpers;
  if (!helpers) return;

  if ('string' === typeof helpers) helpers = [helpers];

  if (util.isArray(helpers)) {
    helpersPath = process.cwd();
    helperFiles = walkSync(helpersPath, helpers);

    helpers = {};
    helperFiles.forEach(function (file) {
      var filePath = path.join(helpersPath, file);
      var helper = require(filePath);
      var key;

      if ('function' === typeof helper) {
        key = getKey(file);
        helpers[key] = helper;
      } else if ('object' === typeof helper) {
        for (key in helper) {
          helpers[key] = helper[key];
        }
      }
    }, this);
  } else if ('function' === typeof helpers) {
    helpers = helpers();
  }

  if ('object' !== typeof helpers) {
    throw Error('options.helpers must be a string, an array of strings, an object or a function');
  }

  this.handlebars.registerHelper(helpers);
};

HandlebarsWriter.prototype.loadPartials = function () {
  var partials = this.options.partials;
  var partialsPath;
  var partialFiles;

  if (!partials) return;

  if ('string' === typeof partials) {
    partials = [partials];
  } else if (!util.isArray(partials)) {
    throw Error('options.partials must be a string or an array of strings');
  }

  partialsPath = process.cwd();
  partialFiles = walkSync(partialsPath, partials);
  partialFiles.forEach(function (file) {
    var key = getKey(file);
    var filePath = path.join(partialsPath, file);
    this.handlebars.registerPartial(key, fs.readFileSync(filePath).toString());
  }, this);
};

HandlebarsWriter.prototype.write = function (readTree, destDir) {
  var self = this;
  this.loadPartials();
  this.loadHelpers();
  return readTree(this.inputTree).then(function (sourceDir) {
    var targetFiles = helpers.multiGlob(self.files, {cwd: sourceDir});
    return RSVP.all(targetFiles.map(function (targetFile) {
      function write (output) {
        var destFilepath = path.join(destDir, self.destFile(targetFile));
        mkdirp.sync(path.dirname(destFilepath));
        var str = fs.readFileSync(path.join(sourceDir, targetFile)).toString();
        var template = self.handlebars.compile(str);
        fs.writeFileSync(destFilepath, template(output));
      }
      var output = ('function' !== typeof self.context) ? self.context : self.context(targetFile);
      return Promise.resolve(output).then(write);
    }));
  });
};

module.exports = HandlebarsWriter;
