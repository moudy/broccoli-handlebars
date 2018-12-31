const path       = require('path');
const fs         = require('fs');
const Plugin     = require('broccoli-plugin');
const Handlebars = require('handlebars');
const walkSync   = require('walk-sync');
const multiGlob  = require('./multi-glob');
const mkdirp     = require('mkdirp');

const EXTENSIONS_REGEX = new RegExp('.(hbs|handlebars)');

HandlebarsWriter.prototype = Object.create(Plugin.prototype);
HandlebarsWriter.prototype.constructor = HandlebarsWriter;
function HandlebarsWriter(inputNodes, filesGlobs, options) {
  options = options || {};
  Plugin.call(this, inputNodes, {
    annotation: options.annotation,
    needsCache: false
  });
  options.name = 'broccoli-handlebars';
  this.options = options;

  this.inputNodes = inputNodes;
  this.filesGlobs = filesGlobs;

  this.context = this.options.context || {};
  this.destFile = this.options.destFile || function (filename) {
    return filename.replace(/(hbs|handlebars)$/, 'html');
  };
  this.handlebars = this.options.handlebars || Handlebars;
  this.handlebarsOptions = this.options.handlebarsOptions;

  this.loadPartials();
  this.loadHelpers();
};

HandlebarsWriter.prototype.loadHelpers = function() {
  const helpers = this.options.helpers;
  if (!helpers) return;

  if ('function' === typeof helpers) helpers = helpers();
  if ('object' !== typeof helpers) {
    throw Error('options.helpers must be an object or a function that returns an object');
  }
  this.handlebars.registerHelper(helpers);
};

HandlebarsWriter.prototype.loadPartials = function() {
  const partials = this.options.partials;

  if (!partials) return;
  if ('string' !== typeof partials) {
    throw Error('options.partials must be a string');
  }

  const partialsPath = path.join(process.cwd(), partials);
  const partialFiles = walkSync(partialsPath).filter(EXTENSIONS_REGEX.test.bind(EXTENSIONS_REGEX));

  partialFiles.forEach(function (file) {
    const key = file.replace(partialsPath, '').replace(EXTENSIONS_REGEX, '');
    const filePath = path.join(partialsPath, file);
    this.handlebars.registerPartial(key, fs.readFileSync(filePath).toString());
  }, this);
};

HandlebarsWriter.prototype.writeTemplateSync = function(sourceDir, outputPath, targetFile, context) {
  // create output folder for the targetFile (the template)
  const destFilepath = path.join(outputPath, this.destFile(targetFile));
  mkdirp.sync(path.dirname(destFilepath));

  // load and compile
  const templateStr = fs.readFileSync(path.join(sourceDir, targetFile)).toString();
  const template = this.handlebars.compile(templateStr, this.handlebarsOptions);

  fs.writeFileSync(destFilepath, template(context));
};

HandlebarsWriter.prototype.build = function() {
  this.loadPartials();
  this.loadHelpers();

  for (let sourceDir of this.inputPaths) {
    let targetFiles = multiGlob(this.filesGlobs, {cwd: sourceDir});
  
    for (let targetFile of targetFiles) {
      let context = ('function' !== typeof this.context) ?
                    this.context :
                    this.context(targetFile);

      this.writeTemplateSync(sourceDir, this.outputPath, targetFile, context);
    };
  }
};

module.exports = HandlebarsWriter;
