/*
 * Copyright 2016 Turner Broadcasting System, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const ContentRetriever = require('../lib/content-retriever.js'),
    url = 'http://www.cnn.com/2016/02/18/entertainment/kanye-west-rants-feat/index.html',
    contentRetriever = new ContentRetriever(url);

contentRetriever.getBaseContentModel().then(function success(baseModel) {
    contentRetriever.getRelatedContent(baseModel).then(function success(hydratedModel) {
        console.log(JSON.stringify(hydratedModel, null, 2));
    });
});
