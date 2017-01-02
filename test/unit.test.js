const sinon            = require('sinon');
const {expect}         = require('chai');
const Plugin           = require('broccoli-plugin');
const HandlebarsWriter = require('..');

describe('HandlebarsWriter | Unit tests', function() {

  let handlebarsMock = null;

  beforeEach(function() {
    handlebarsMock = {
      registerHelper: sinon.spy(),
      registerPartial: sinon.spy()
    };
  });

  describe('constructor', function() {
    it('creates an instance of broccoli-plugin', function() {
      const inputNodes = [];
      const instance = new HandlebarsWriter(inputNodes);
      expect(instance instanceof Plugin).to.be.true;
    });
  });

  describe('#loadHelpers', function() {
    it('invokes registerHelper with the helpers object', function() {
      let inputNodes = [];
      const files = null;
      let options = {
        handlebars: handlebarsMock,
        helpers: {_debug: 'test hbs helper'} 
      };
      new HandlebarsWriter(inputNodes, files, options);
      expect(handlebarsMock.registerHelper.alwaysCalledWithExactly(options.helpers)).to.be.true;
    });
  });

  describe('#loadPartials', function() {
    it('invokes registerPartial recursively in a directory', function() {
      let inputNodes = [];
      const files = null;
      let options = {
        handlebars: handlebarsMock,
        partials: 'test/fixtures/partials' 
      };
      new HandlebarsWriter(inputNodes, files, options);
      expect(handlebarsMock.registerPartial.calledTwice).to.be.true;

      let key = 'partial-1';
      let value = '{{foobar1}}\n'; 
      let result = handlebarsMock.registerPartial.calledWithExactly(key, value);
      expect(result).to.be.equal(true, 'partial-1 was registered');

      key = 'partial-2';
      value = '{{foobar2}}\n'; 
      result = handlebarsMock.registerPartial.calledWithExactly(key, value);
      expect(result).to.be.equal(true, 'partial-1 was registered');
    });
  });

});
