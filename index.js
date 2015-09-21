var path       = require('path');
var fs         = require('fs');
var util       = require('util');
var Plugin     = require('broccoli-plugin');
var Handlebars = require('handlebars');
var walkSync   = require('walk-sync');
var RSVP       = require('rsvp');
var mkdirp     = require('mkdirp');
var Promise    = RSVP.Promise;

var loadedHelpers = [], loadedPartials = [];

var getKey = function (str) {
  return path.basename(str, path.extname(str));
};

var defaultOptions = {
  context: {},
  destFile: function (filename) {
    return filename.replace(/(hbs|handlebars)$/, 'html');
  },
  handlebars: Handlebars
};

module.exports = HandlebarsCompiler;
HandlebarsCompiler.prototype = Object.create(Plugin.prototype);
HandlebarsCompiler.prototype.constructor = HandlebarsCompiler;
function HandlebarsCompiler(inputNode, files, options) {
  if (!(this instanceof HandlebarsCompiler)) {
    return new HandlebarsCompiler(inputNode, files, options);
  }

  Plugin.call(this, [inputNode]);

  options = Handlebars.Utils.extend({}, defaultOptions, options || {});
  this.options = options;
  this.files = files;
}

HandlebarsCompiler.prototype.clearHelpers = function () {
  var self = this;
  loadedHelpers.forEach(function (helper) {
    self.options.handlebars.unregisterHelper(helper);
  });
  loadedHelpers = [];
};

HandlebarsCompiler.prototype.loadHelpers = function () {
  this.clearHelpers();

  var helpers = this.options.helpers;
  if (!helpers) return;

  if ('string' === typeof helpers) helpers = [helpers];

  if (util.isArray(helpers)) {
    helpersPath = this.inputPaths[0];
    helperFiles = walkSync(helpersPath, helpers);


    helpers = {};
    helperFiles.forEach(function (file) {
      var filePath = fs.realpathSync(path.join(helpersPath, file));
      delete require.cache[filePath];
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

  this.options.handlebars.registerHelper(helpers);

  loadedHelpers = Object.keys(helpers);
};

HandlebarsCompiler.prototype.generateToc = function (files) {
  files = files.map(function (file) {
    if (file.indexOf('tpl/index.hbs') >= 0) return '';
    return '<li><a href="' + file.replace(/^tpl|/, '').replace(/\.hbs$/, '.html') + '">' + path.basename(file, path.extname(file)) + '</a></li>';
  });

  this.options.handlebars.registerPartial('toc', function () {
    var output = '<ul>' + files.join('') + '</ul>';
    return output;
  });
};

HandlebarsCompiler.prototype.clearPartials = function () {
  var self = this;
  loadedPartials.forEach(function (partial) {
    self.options.handlebars.unregisterPartial(partial);
  });
  loadedPartials = [];
};

HandlebarsCompiler.prototype.loadPartials = function () {
  this.clearPartials();

  var partials = this.options.partials;
  var partialsPath;
  var partialFiles;

  if (!partials) return;

  if ('string' === typeof partials) {
    partials = [partials];
  } else if (!util.isArray(partials)) {
    throw Error('options.partials must be a string or an array of strings');
  }

  partialsPath = this.inputPaths[0];
  partialFiles = walkSync(partialsPath, partials);
  partialFiles.forEach(function (file) {
    var key = getKey(file);
    var filePath = path.join(partialsPath, file);
    this.options.handlebars.registerPartial(key, fs.readFileSync(filePath).toString());
    loadedPartials.push(key);
  }, this);
};

HandlebarsCompiler.prototype.build = function() {
  var self = this;
  var inputPath = this.inputPaths[0];
  var outputPath = this.outputPath;

  var files = walkSync(inputPath, this.files);

  this.generateToc(files);
  this.loadPartials();
  this.loadHelpers();

  var processFile = function (file) {
      var context = ('function' !== typeof self.options.context) ? self.options.context : self.options.context(file, inputPath);
      return Promise.resolve({
        file: file,
        context: context
      }).then(writeFile);
  };

  var writeFile = function (obj) {
    var file = obj.file;
    var context = obj.context;

    var destFilePath = path.join(outputPath, self.options.destFile(file));
    mkdirp.sync(path.dirname(destFilePath));

    var str = fs.readFileSync(path.join(inputPath, file)).toString();
    var template, output;
    try {
      template = self.options.handlebars.compile(str);
      output = template(context);
    } catch(e) {
      console.log('Failed to compile: ' + file);
      throw e;
    }

    fs.writeFileSync(destFilePath, output);
  };

  return RSVP.all(files.map(processFile));
};
