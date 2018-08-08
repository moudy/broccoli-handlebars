const glob = require('glob');

// Copy pasta from broccoli-kitchen-sink-helpers
// This version doesn't throw an error on empty matches.
// See: https://github.com/broccolijs/broccoli-kitchen-sink-helpers/pull/35

// Multi-glob with reasonable defaults, so APIs all behave the same
function multiGlob (globs, globOptions) {
  if (!Array.isArray(globs)) {
    throw new TypeError("multiGlob's first argument must be an array");
  }

  const allowEmpty = globOptions.allowEmpty;
  delete globOptions.allowEmpty;

  var options = {
    follow: true,
    nomount: true,
    strict: true
  }
  Object.assign(options, globOptions);

  var pathSet = {}
  var paths = []
  for (var i = 0; i < globs.length; i++) {
    if (options.nomount && globs[i][0] === '/') {
      throw new Error('Absolute paths not allowed (`nomount` is enabled): ' + globs[i])
    }
    var matches = glob.sync(globs[i], options)
    for (var j = 0; j < matches.length; j++) {
      if (!pathSet[matches[j]]) {
        pathSet[matches[j]] = true
        paths.push(matches[j])
      }
    }
  }
  return paths
}

module.exports = multiGlob;
