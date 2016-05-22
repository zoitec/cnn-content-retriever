# CNN Content Retriever

A service designed to pull content from Hypatia for CNN content.  Hypatia is
an in-house API for working with CNN content.



## Requirements

Read these "_requirements_" as, "_only tested with_".

- [Node.js](https://nodejs.org/) 6.x+



## Install

This package is in development and has not been published to npm yet.  However,
once it is, you can install it like this:

```shell
$ npm install --save --save-exact cnn-content-retriever
```

The `--save-exact` is up to you.  I recommend saving exact versions.



## Usage

This is intended to be used as a dependency in a larger application.  Refer to
the the below example and the real [example.js](./example/example.js), that you
can run with `node example/example.js`.

```javascript
'use strict';

const ContentRetriever = require('cnn-content-retriever'),
    url = 'http://www.cnn.com/2016/02/18/entertainment/kanye-west-rants-feat/index.html',
    contentRetriever = new ContentRetriever(url);

contentRetriever.getBaseContentModel().then(function success(baseModel) {
    contentRetriever.getRelatedContent(baseModel).then(function success(hydratedModel) {
        console.log(JSON.stringify(hydratedModel, null, 2));
    });
});
```

More details to come.



## ESDoc Documentation

You can generate and view the docs locally with the commands below.  The `open`
command will only work on MacOS.

```shell
$ npm run generate-docs
$ open docs/index.html
```

You can also browse the most current release at
http://d1qmctp03wa6q9.cloudfront.net/cnn-content-retriever/index.html. CNAME
coming at some point.



## NPM scripts

- `generate-authors` - Generates [AUTHORS.md](./AUTHORS.md).
- `generate-changelog` - Generates output to put in [CHANGELOG.md](./CHANGELOG.md).
- `generate-coverage` - Generates a code coverage report in `/coverage`.
- `generate-docs` - Generates ESDoc documentation in `/docs`.
- `test` - Runs all tests.
- `update-apply` - Updates [package.json](./package.json) with dependency updates.
- `update-check` - Outputs if any dependency updates are needed.



## Environment variables

- `DEBUG=cnn-content-retriever:*` - Set to enable visible
  [debug](https://www.npmjs.com/package/debug) logging to console.



## Developer notes

- Always develop on the node version specified in the [.nvmrc](./.nvmrc) file.
  If [nvm](https://github.com/creationix/nvm) is used typing `nvm install`
  in the terminal will insure the correct version is used.

- Contributors should read [CONTRIBUTING.md](./CONTRIBUTING.md).

- Collaborators should read [COLLABORATOR_GUIDE.md](./COLLABORATOR_GUIDE.md).

- The current Project Owner (PO) of this project is James Young (@jamsyoung).



## Licensing

See [LICENSE.md](./LICENSE.md) for details.




[![build](https://img.shields.io/travis/cnnlabs/cnn-content-retriever/master.svg?style=flat-square)](https://travis-ci.org/cnnlabs/cnn-content-retriever)

♥
