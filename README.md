# Broccoli Handlebars

[Broccoli](https://github.com/broccolijs/broccoli) plugin for compiling handlebars templates that supports using an existing Handlebars instance, partials, helpers, and render context based on the filename.

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

var tree = broccoliHandlebars(tree, {
  helpers: helpers
, handlebars: Handlebars
, partials: 'partials-path'
, context: function (filename) { return dataForFile(filename); };
});
```

### Options

#### context (optional)
A function or object used as the render context. The function is passed the filename allowing for dynamic contexts.
```
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
});
```


#### helpers (optional)
An object of helpers
```
module.exports = {
  firstName: function (str) { return str.split(' ')[0]; }
};

// Hi {{firstName user.fullName}}
```

#### handelbars (optional)
A Handlebars instance. Useful if you need to make sure you are using a specific version or have already registerd partials/helpers.
```
var tree = broccoliHandlebars(tree, {
  handlebars: require('handlebars')
});
```

#### partials (optional)
Either a string that is the path to partials or an object where the key is the name of the partial and the value is the actual partial string.
```
var tree = broccoliHandlebars(tree, {
  partials: 'path/to/partials'
  // or
  partials: {
    'header': '<header>foo</header'
  , 'users/card': '<div>bar</div'
  }
});
```
