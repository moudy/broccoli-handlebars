var path       = require('path');
var fs         = require('fs');
var Writer     = require('broccoli-writer');
var Handlebars = require('handlebars');
var walkSync   = require('walk-sync');
var RSVP       = require('rsvp');
var helpers    = require('broccoli-kitchen-sink-helpers');
var mkdirp     = require('mkdirp');
var Promise    = RSVP.Promise;

var EXTENSIONS_REGEX = new RegExp('.(hbs|handlebars)');

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

  if ('function' === typeof helpers) helpers = helpers();
  if ('object' !== typeof helpers) {
    throw Error('options.helpers must be an object or a function that returns an object');
  }
  this.handlebars.registerHelper(helpers);
};

HandlebarsWriter.prototype.loadPartials = function () {
  var partials = this.options.partials;
  var partialsPath;
  var partialFiles;

  if (!partials) return;
  if ('string' !== typeof partials) {
    throw Error('options.partials must be a string');
  }

  partialsPath = path.join(process.cwd(), partials);
  partialFiles = walkSync(partialsPath).filter(EXTENSIONS_REGEX.test.bind(EXTENSIONS_REGEX));

  partialFiles.forEach(function (file) {
    var key = file.replace(partialsPath, '').replace(EXTENSIONS_REGEX, '');
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