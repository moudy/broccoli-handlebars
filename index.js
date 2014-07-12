'use strict';

var Filter = require('broccoli-filter');
var Handlebars = require('handlebars');

var HandlebarsFilter = function (inputTree, options) {

  if (!(this instanceof HandlebarsFilter)) {
    return new HandlebarsFilter(inputTree, options);
  }

  Handlebars.registerHelper(options.helpers || {});
  this.options = options || {};
  this.context = options.context || {};
  this.handlebars = options.handlebars || Handlebars;
  this.inputTree = inputTree;
};

HandlebarsFilter.prototype = Object.create(Filter.prototype);
HandlebarsFilter.prototype.constructor = HandlebarsFilter;

HandlebarsFilter.prototype.extensions = ['hbs', 'handlebars'];
HandlebarsFilter.prototype.targetExtension = 'html';

HandlebarsFilter.prototype.processString = function (str, file) {
  var context = this.context;

  if ('function' === typeof context) {
    context = context(file);
  }

  var template = this.handlebars.compile(str);
  return template(context);
};

module.exports = HandlebarsFilter;

