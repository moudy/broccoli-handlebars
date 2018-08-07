const fs               = require('fs');
const path             = require('path');
const {expect}         = require('chai');
const Plugin           = require('broccoli-plugin');
const HandlebarsWriter = require('..');
const Funnel           = require('broccoli-funnel');
const Handlebars       = require('handlebars');
const multidepRequire  = require('multidep')('test/multidep.json');

describe('HandlebarsWriter | Integration tests', function() {

  multidepRequire.forEachVersion('broccoli', function(broccoliVersion, module) {

    var Builder = module.Builder

    // Call .build on the builder and return outputPath;
    // works across Builder  versions
    function build(builder) {
      return Promise.resolve()
        .then(function() {
          return builder.build();
        })
        .then(function(hash) {
          return /^0\./.test(broccoliVersion) ? hash.directory : builder.outputPath;
        })
    }

    describe('Broccoli ' + broccoliVersion, function() {
      it('builds without errors', function() {
        let inputNodes = ['test/fixtures/templates'];
        let filesGlobs = ['*.hbs', '*.handlebars'];
        let options = {
          handlebars: Handlebars
        };
        const builder = new Builder(new HandlebarsWriter(inputNodes, filesGlobs, options));

        return build(builder).then(function(outputPath) {
          let filePath = path.join(outputPath, 'template-1.html');
          let fileText = fs.readFileSync(filePath).toString();
          expect(fileText).to.be.equal('template 1\n');

          filePath = path.join(outputPath, 'template-2.html');
          fileText = fs.readFileSync(filePath).toString();
          expect(fileText).to.be.equal('template 2\n');
        });
      })

      it('can consume a single Broccoli node', function() {
        // broccoli-plugin always expects an Array
        let inputNodes = [new Funnel('test/fixtures/templates')];
        let filesGlobs = ['*.hbs'];
        let options = {
          handlebars: Handlebars
        };
        const builder = new Builder(new HandlebarsWriter(inputNodes, filesGlobs, options));

        return build(builder).then(function(outputPath) {
          let filePath = path.join(outputPath, 'template-1.html');
          let fileText = fs.readFileSync(filePath).toString();
          expect(fileText).to.be.equal('template 1\n');
        });
      })
    });

  });

});
