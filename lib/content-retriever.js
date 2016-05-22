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

const async = require('async'),
    debug = require('debug'),
    parseString = require('xml2js').parseString,
    request = require('request');

/**
 * Retrieves a full hydrated content model from Hypatia for a given supported
 * url.  A supported url is any content that is indexed by Hypatia.  This
 * includes all content on http://www.cnn.com, http://edition.cnn.com,
 * http://money.cnn.com, and http://www.greatbigstory.com.  It is important to
 * understand that all of the content on edition.cnn.com is the same as
 * www.cnn.com.  When querying an edition.cnn.com url make sure to use the
 * www.cnn.com domain.
 *
 * The example can be found in the repository in `example/example.js`.
 *
 * @example
 * const ContentRetriever = require('cnn-content-retriever'),
 *     url = 'http://www.cnn.com/2016/02/18/entertainment/kanye-west-rants-feat/index.html',
 *     contentRetriever = new ContentRetriever(url);
 *
 * contentRetriever.getBaseContentModel().then(function success(baseModel) {
 *     contentRetriever.getRelatedContent(baseModel).then(function success(hydratedModel) {
 *         console.log(JSON.stringify(hydratedModel, null, 2));
 *     });
 * });
 */
class ContentRetriever {
    /**
     * @param {String} url
     * A url to lookup in Hypatia.
     *
     * @example
     * const ContentRetriever = require('cnn-content-retriever'),
     *     url = 'http://www.cnn.com/2016/02/18/entertainment/kanye-west-rants-feat/index.html',
     *     contentRetriever = new ContentRetriever(url);
     */
    constructor(url) {
        /**
         * The url to retrieve from Hypatia.  This should only be set by the
         * constructor when the class is instantiated.
         *
         * @type {String}
         *
         * @example
         * http://www.cnn.com/2016/02/18/entertainment/kanye-west-rants-feat/index.html
         */
        this.url = url;

        this.hypatiaHost = 'http://hypatia.api.cnn.com/';
        this.hypatiaRoute = 'svc/content/v2/search/collection1/';
        this.timeout = 5; // 5 seconds / 5000 millisconds
    }



    /**
     * Gets the hypata host to connect to.
     *
     * @type {String}
     *
     * @example
     * console.log(contentRetriever.hypatiaHost);
     */
    get hypatiaHost() {
        return this._hypatiaHost;
    }



    /**
     * Sets the hypatia host and defaults to `http://hypatia.api.cnn.com/`.
     *
     * @type {String}
     *
     * @example
     * contentRetriever.hypatiaHost = 'http://hypatia.api.cnn.com/';
     */
    set hypatiaHost(value) {
        this._hypatiaHost = value;
    }



    /**
     * Gets the hypata route to use.
     *
     * @type {String}
     *
     * @example
     * console.log(contentRetriever.hypatiaRoute);
     */
    get hypatiaRoute() {
        return this._hypatiaRoute;
    }



    /**
     * Gets the hypata route to use and defaults to
     *`svc/content/v2/search/collection1/`.
     *
     * @type {String}
     *
     * @example
     * contentRetriever.hypatiaRoute = 'svc/content/v2/search/collection1/';
     */
    set hypatiaRoute(value) {
        this._hypatiaRoute = value;
    }



    /**
     * Gets the timeout value, in milliseconds, for use with http requests.
     *
     * @type {String}
     *
     * @example
     * console.log(contentRetriever.timeout);
     */
    get timeout() {
        return this._timeout;
    }



    /**
     * Sets the timeout value, in seconds, for all http requests to hypatia;
     * Default is 5 seconds (5000 milliseconds)
     *
     * @type {Number}
     *
     * @example
     * contentRetriever.timeout = 5;
     */
    set timeout(value) {
        let debugLog = debug('cnn-content-retriever:timeout');
        value = (typeof value !== 'number') ? parseInt(value) : value;
        value = value === 0 ? 1 : value;
        this._timeout = 1000 * value;
        debugLog(`Set request timeout to ${this._timeout}`);
    }



    /**
     * Gets a base content model from Hypatia for a given url.  This is not a
     * complete content model, there may be elements in this model that are just
     * references to other models that must be fetched.  An example of this
     * would be the images that go in a gallery.
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     *
     * @example
     * contentRetriever.getBaseContentModel().then(function success(baseModel) {
     *     console.log(baseModel);
     * });
     */
    getBaseContentModel() {
        let self = this,
            debugLog = debug('cnn-content-retriever:getBaseContentModel'),
            apiEndpoint = `${self.hypatiaHost}${self.hypatiaRoute}`,
            query = `url:${encodeURIComponent(self.url)}`;

        debugLog(`Hypatia query: ${apiEndpoint}${query} with ${self.timeout} millisecond timeout`);

        return new Promise(function (resolve, reject) {
            try {
                request.get({json: true, url: `${apiEndpoint}${query}`, timeout: self.timeout}, function (error, response, body) {
                    if (error) {
                        error.message = `${error.message} - ${apiEndpoint}${query}`;
                        reject(error);
                    } else {
                        if (body.docs.length === 0) {
                            reject(new Error('no content found'));
                        }

                        resolve(body);
                    }
                });
            } catch (error) {
                debugLog(`Error in getBaseContentModel: ${JSON.stringify(error)}`);
            }
        });
    }



    /**
     * Gets the slides from Hypatia for a gallery query.
     *
     * @private
     *
     * @param {String} url
     * The full url to call to return the content needed for a gallery.  This is
     * found in the base content model in the `referenceUrl` of a gallery
     * element.
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getGallerySlides(url) {
        let self = this,
            debugLog = debug('cnn-content-retriever:getGallerySlides');

        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                try {
                    request.get({json: true, url: url, timeout: self.timeout}, function (error, response, body) {
                        if (error) {
                            done(error);
                        } else {
                            if (body.docs[0] && body.docs[0].slides) {
                                done(null, body.docs[0].slides);
                            } else {
                                done(new Error(`No slides in gallery: ${url}`));
                            }
                        }

                    });
                } catch (error) {
                    debugLog(`Error in getGallery Slides: ${error}`);
                }
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }



    /**
     * Gets the related content for a base content model.
     *
     * @param {Object} data
     * The base content model returned from `getBaseContentModel`.
     *
     * @returns {Promise}
     * Returns a promise with the complete content model on success or an error
     * message on failure.
     *
     * @example
     * contentRetriever.getBaseContentModel().then(function success(baseModel) {
     *     contentRetriever.getRelatedContent(baseModel).then(function success(hydratedModel) {
     *         console.log(hydratedModel);
     *     });
     * });
     */
    getRelatedContent(data) {
        let self = this;

        return new Promise(function (resolve, reject) {
            async.parallel([
                function (callback) {
                    self.processParagraphs(data, callback);
                },
                function (callback) {
                    self.processRelatedMedia(data, callback);
                },
                function (callback) {
                    self.processVideoContentType(data, callback);
                }
            ], function (error) {
                if (error) {
                    reject(error);
                }

                resolve(data);
            });
        });
    }



    /**
     * Gets the video url by calling the `cvpXmlUrl` and finding the correct
     * .m3u8 url.
     *
     * @private
     *
     * @param {String} url
     * The url to the video XML file that has details for all of the different
     * video files.
     *
     * @param {String} dataSource
     * Should be a valid dataSource
     *
     * @returns {Promise}
     */
    getVideoUrl(url, dataSource) {
        let self = this,
            debugLog = debug('cnn-content-retriever:getVideoUrl');

        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                url = url.replace(/\s/g, '%20');

                debugLog(`GETTING VIDEO XML: ${url}`);

                request.get({url: url, timeout: self.timeout}, function (error, response, body) {
                    if (error) {
                        debugLog(`Error retrieving ${url}`);
                        done(error);
                    }

                    if (body) {
                        parseString(body, {trim: true}, function (err, result) {
                            let m3u8Url,
                                bitrate = (dataSource === 'cnn') ? 'hls_1080p' : 'ipadFile';

                            if (err) {
                                debugLog(`Error parsing video xml: ${url} - ${err}`);
                                done(err);
                            } else {
                                debugLog(`DATASOURCE FOR VIDEO XML PARSE IS: ${dataSource}`);

                                if (result && result.video && result.video.files && result.video.files[0].file && result.video.files[0].file.length > 0) {
                                    result.video.files[0].file.some(function (file) {
                                        debugLog(`Comparing file.$.bitrate: ${file.$.bitrate} to bitrate: ${bitrate}`);
                                        if (file.$.bitrate === bitrate) {
                                            debugLog(`MATCH FOUND: ${file._}`);
                                            m3u8Url = file._;
                                            return true;
                                        }
                                    });

                                    debugLog(`RESOLVED m3u8Url: ${m3u8Url}`);
                                    done(null, m3u8Url);
                                } else {
                                    done(new Error(`${url} is blank or malformed.`));
                                }
                            }
                        });
                    } else {
                        debugLog(`Error retrieving video xml for: ${url} with body: ${body}`);
                        done(new Error(`Error in getVideoUrl - body was falsy: ${body}`));
                    }
                });
            }], function (error, result) {
                if (error) {
                    reject(error);
                }

                resolve(result);
            });
        });
    }



    /**
     * Loops though an array of paragraphs to fetch referenced data.
     *
     * @private
     *
     * @param {Object} data
     * A Hyptia response object.
     *
     * @param {Function} callback
     * An async parallel callback function from getRelatedContent()
     */
    processParagraphs(data, callback) {
        let self = this,
            debugLog = debug('cnn-content-retriever:processParagraphs'),
            index = 0;

        try {
            if (data.docs[0].body) {
                async.eachSeries(data.docs[0].body.paragraphs, function (paragraph, callbackEachSeries) {
                    if (paragraph.elements.length > 0 && paragraph.elements[0].type !== 'embed') {
                        if (paragraph.elements[0].target.type === 'gallery') {
                            self.getGallerySlides(paragraph.elements[0].target.referenceUrl).then(
                                function success(result) {
                                    data.docs[0].body.paragraphs[index].slides = result;
                                    index++;
                                    callbackEachSeries();
                                },
                                function failure(error) {
                                    index++;
                                    callbackEachSeries(error);
                                }
                            ).catch(function (error) {
                                debugLog(`ERROR5: ${JSON.stringify(error)}`);
                            });
                        } else {
                            index++;
                            callbackEachSeries();
                        }
                    } else {
                        index++;
                        callbackEachSeries();
                    }
                }, function (error) {
                    callback(error);
                });
            } else {
                callback();
            }
        } catch (error) {
            debugLog(`Error in getRelatedContent::processParagraphs ${JSON.stringify(error)}`);
        }
    }



    /**
     * Loops though an array of relatedMedia to fetch and referenced data.
     *
     * @private
     *
     * @param {Object} data
     * A Hypatia response object.
     *
     * @param {Function} callback
     * An async parallel callback function from getRelatedContent()
     */
    processRelatedMedia(data, callback) {
        let self = this,
            debugLog = debug('cnn-content-retriever:processRelatedMedia'),
            index = 0;

        try {
            async.eachSeries(data.docs[0].relatedMedia.media, function (media, callbackEachSeries) {
                if (media.type === 'reference') {
                    switch (media.referenceType) {
                        case 'gallery':
                            self.getGallerySlides(media.referenceUrl).then(
                                function success(result) {
                                    data.docs[0].relatedMedia.media[index].slides = result;
                                    index++;
                                    callbackEachSeries();
                                },
                                function failure(error) {
                                    index++;
                                    callbackEachSeries(error);
                                }
                            ).catch(function (error) {
                                debugLog(`ERROR6: ${JSON.stringify(error)}`);
                            });
                            break;

                        case 'video':
                            self.getVideoUrl(media.cvpXmlUrl, data.docs[0].dataSource || 'cnn').then(
                                function success(result) {
                                    data.docs[0].relatedMedia.media[index].m3u8Url = result;
                                    index++;
                                    callbackEachSeries();
                                },
                                function failure(error) {
                                    index++;
                                    callbackEachSeries(error);
                                }
                            ).catch(function (error) {
                                debugLog(`ERROR7: ${error.stack}`);
                            });
                            break;

                        default:
                            index++;
                            callbackEachSeries();
                    }
                } else {
                    index++;
                    callbackEachSeries();
                }
            }, function (error) {
                callback(error);
            });
        } catch (error) {
            callback(error);
            debugLog(`Error in getRelatedContent::processRelatedMedia ${JSON.stringify(error)}`);
        }
    }



    /**
     * For a video content type (not an article content type), get the .m3u8Url
     *
     * @private
     *
     * @param {Object} data
     * A Hyptia response object.
     *
     * @param {Function} callback
     * An async parallel callback function from getRelatedContent()
     */
    processVideoContentType(data, callback) {
        let self = this,
            debugLog = debug('cnn-content-retriever:processVideoContentType');

        // TODO - major - this is a mess - should base logic off of data.docs[0].dataSource and type
        if (data.docs[0].cdnUrls && data.docs[0].cdnUrls.hlsVideoURL) {
            data.docs[0].m3u8Url = data.docs[0].cdnUrls.hlsVideoURL;
            callback();
        } else {
            if (data.docs[0].cvpXmlUrl) {
                self.getVideoUrl(data.docs[0].cvpXmlUrl, data.docs[0].dataSource || 'cnn').then(
                    function success(result) {
                        data.docs[0].m3u8Url = result; // this is needed to play the video
                        data.docs[0].videoURL = result; // this is needed to set the videoURL property in metadata
                        // TODO - minor - The above two lines should be reimagined
                        callback();
                    },
                    function failure(error) {
                        callback(error);
                    }
                ).catch(function (error) {
                    debugLog(`ERROR8: ${JSON.stringify(error)}`);
                });
            } else {
                callback();
            }
        }
    }
}



module.exports = ContentRetriever;
