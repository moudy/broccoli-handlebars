# Broccoli Handlebars

[Broccoli](https://github.com/broccolijs/broccoli) plugin for compiling handlebars templates that supports using an existing Handlebars instance, partials, helpers, and asynchronous render context based on the filename.

### Install
```
npm install --save broccoli-handlebars
```

### Example
```js
var Handlebars = require('handlebars');
var broccoliHandlebars = require('broccoli-handlebars');
var helpers = require('./my-helpers-object');
var dataForFile = require('./get-view-data');

var tree = 'site';

var tree = broccoliHandlebars(tree, ['pages/**/*.hbs'], {
  helpers: helpers
, handlebars: Handlebars
, partials: 'path/to/partials/**/*.hbs'
, context: function (filename) { return dataForFile(filename); }
, destFile: function (filename) { return filename.replace(/\.(hbs|handlebars)$/, ''); }
});
```

### Usage

```js
var hbsTree = broccoliHandlebars(tree, [outputFiles], options);
```
- **tree** - a broccoli tree or string of handlebars files to watch (including partials for example)
- **outputFiles** - an array of filenames or globs that will be compiled
- **options** - Handlebars options, see below


### Options

#### context (optional)
A function or object used as the render context. The function is passed the filename allowing for dynamic contexts. The function may return a value directly or a promise the resolves to a value.
```js
function RenderContext () {}

RenderContext.prototype.render = function (filename) {
  return {
    title: filename.toUpperCase()
  };
};

var renderContext = new RenderContext();

var tree = broccoliHandlebars(tree, {
  // An object that is the same for each file
  context: { title: 'Foo' }

  // or renter data based on the file name
  context: renderContext.render.bind(renderContext)

  // or return a promise
  context: function () { return $.getJSON('/data.json'); }
});
```

#### destFile (optional)
A function that returns the name of a Handlebars-compiled file in the Broccoli output tree. The function is called for every input file, with `filename` supplied. If no function is supplied, the default is for the .hbs or .handlebars suffix of `filename` to be replaced with .html. E.g. `example.hbs` becomes `example.html`.

```js
var tree = broccoliHandlebars(tree, {
    destFile: function (filename) { return filename.replace(/\.(hbs|handlebars)$/, ''); }
});

// Generate output files like Rails sprockets
// example.json.hbs -> example.json
```

#### helpers (optional)
Can be:
- A string that points to a folder with helpers relative to the current directory, which usually is where `Brocfile.js` lives.
- An array of above strings
- An object of helpers
- A function that returns an object of helpers.

Globs are supported for strings.

##### Example of function that returns an object
```js
// my-helpers-object.js
// Exports an object of helpers.
module.exports = {
  firstName: function (str) { return str.split(' ')[0]; }
};

// Hi {{firstName user.fullName}}

```

##### Example of helpers in folder

File structure example:

    helpers
    ├─ firstname.js
    └─ multiple-helpers.js
    …

```js
// firstname.js
// The file name without extension will become the helper name.
// Only one helper per file with this syntax.
module.exports = function (str) {
  return str.split(' ')[0];
};
```

```js
// multiple-helpers.js
// Good for when you need to share code between helpers, call them from each other or just want to group them in files.
module.exports = {
  uppercase: function (str) { return str.toUpperCase(); }
, lowercase: function (str) { return str.toLowerCase(); }
};
```

```js
var tree = broccoliHandlebars(tree, {
  helpers: 'path/to/helpers/**/*.hbs'
});
```

You can then use these helpers in your templates like this:
  - `{{firstname user.fullName}}`
  - `{{uppercase "Make this upper case"}}`
  - `{{lowercase "Make this lower case"}}`

#### handelbars (optional)
A Handlebars instance. Useful if you need to make sure you are using a specific version or have already registerd partials/helpers.
```js
var tree = broccoliHandlebars(tree, {
  handlebars: require('handlebars')
});
```

#### partials (optional)
Can be:
- A string that points to a folder with partials relative to the current directory, which usually is where `Brocfile.js` lives.
- An array of above strings

Globs are supported for strings.

```js
var tree = broccoliHandlebars(tree, {
  partials: 'path/to/partials/**/*.hbs'
});
```
