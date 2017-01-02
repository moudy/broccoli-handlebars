const fs               = require('fs');
const path             = require('path');
const {expect}         = require('chai');
const Plugin           = require('broccoli-plugin');
const HandlebarsWriter = require('..');
const Handlebars       = require('handlebars');
const RSVP             = require('RSVP');
const multidepRequire  = require('multidep')('test/multidep.json');

describe('HandlebarsWriter | Integration tests', function() {

  multidepRequire.forEachVersion('broccoli', function(broccoliVersion, module) {

    var Builder = module.Builder

    // Call .build on the builder and return outputPath;
    // works across Builder  versions
    function build(builder) {
      return RSVP.Promise.resolve()
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
          handlebars: Handlebars,
          destDir: 'test/tmp'
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
    });

  });

});
