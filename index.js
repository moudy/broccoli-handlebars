'use strict';

var path = require('path');
var fs = require('fs');
var Filter = require('broccoli-filter');
var Handlebars = require('handlebars');
var walkSync = require('walk-sync');
var RSVP = require('rsvp');
var Promise = RSVP.Promise;

var HandlebarsFilter = function (inputTree, options) {

  if (!(this instanceof HandlebarsFilter)) {
    return new HandlebarsFilter(inputTree, options);
  }

  this.inputTree = inputTree;

  this.options = options || {};
  this.context = options.context || {};
  this.handlebars = options.handlebars || Handlebars;
  if (options.helpers) {
    this.handlebars.registerHelper(options.helpers);
  }

  var partials = options.partials;
  var partialsPath;
  var partialsObj;
  var extensionRegex;
  var files;

  if (partials) {
    if ('string' === typeof partials) {
      extensionRegex = new RegExp('.('+this.extensions.join('|')+')');
      partialsObj = {};
      partialsPath = path.join(process.cwd(), partials);
      files = walkSync(partialsPath).filter(extensionRegex.test.bind(extensionRegex));

      files.forEach(function (file) {
        var key = file.replace(partialsPath, '').replace(extensionRegex, '');
        var filePath = path.join(partialsPath, file);
        partialsObj[key] = fs.readFileSync(filePath).toString();
      });
    } else {
      partialsObj = partials;
    }
    this.handlebars.registerPartial(partialsObj);
  }
};

HandlebarsFilter.prototype = Object.create(Filter.prototype);
HandlebarsFilter.prototype.constructor = HandlebarsFilter;

HandlebarsFilter.prototype.extensions = ['hbs', 'handlebars'];
HandlebarsFilter.prototype.targetExtension = 'html';

HandlebarsFilter.prototype.processString = function (str, file) {
  var template = this.handlebars.compile(str);
  var context = this.context;
  if ('function' !== typeof context) return template(context);
  return Promise.resolve(context(file)).then(template);
};

module.exports = HandlebarsFilter;

