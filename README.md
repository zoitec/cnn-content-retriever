# CNN Content Retriever

A service designed to pull content from Hypatia for CNN content.  Hypatia is
an in-house API for working with CNN content.


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


## Licensing

See [LICENSE.md](./LICENSE.md) for details.
