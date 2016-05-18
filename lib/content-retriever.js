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
    parseString = require('xml2js').parseString,
    request = require('request'),
    timeout = 1000 * 20;



/**
 * @class ContentRetriever
 *
 * @classdesc
 * Retrieves content from Hypatia for a given url.
 *
 * ##### Public Methods
 * - [getBaseContentModel]{@link ContentRetriever#getBaseContentModel}
 * - [getRelatedContent]{@link ContentRetriever#getRelatedContent}
 *
 * ##### Private Methods
 * - [getGallerySlides]{@link ContentHelper#getGallerySlides}
 * - [getVideoUrl]{@link ContentHelper#getVideoUrl}
 *
 * @param {String} url
 * The url to retrieve.
 *
 */
class ContentRetriever {
    constructor(url) {
        /**
         * @member {String} ContentRetriever#url
         * The url to retrieve.
         */
        this.url = url;
    }



    /**
     * Gets a base content model from Hypatia for a given url.  This is not a
     * complete content model, there may be elements in this model that are just
     * references to other models that must be fetched.  An example of this
     * would be the images that go in a gallery.
     *
     * @function ContentRetriever#getBaseContentModel
     *
     * @public
     *
     * @returns {Promise}
     * Returns a promise with the content model on success or an error message
     * on failure.
     */
    getBaseContentModel() {
        let self = this,
            apiEndpoint = 'http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/',
            query = `url:${encodeURIComponent(self.url)}`;

        console.log(`Hypatia query: ${apiEndpoint}${query}`);

        return new Promise(function (resolve, reject) {
            try {
                request.get({json: true, url: `${apiEndpoint}${query}`, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        error.message = `${error.message} - ${apiEndpoint}${query}`;
                        reject(error);
                    } else {
                        if (body.docs.length === 0) {
                            reject(new Error('no content found'));
                        }

                        // Apple does not support gifs
                        // jy - I did this mess, lets clean it up later when I am not drugged up on cold medicince
                        if (body.docs[0] &&
                            body.docs[0].relatedMedia &&
                            body.docs[0].relatedMedia.media[0] &&
                            body.docs[0].relatedMedia.media[0].cuts &&
                            body.docs[0].relatedMedia.media[0].cuts.keyFrame &&
                            body.docs[0].relatedMedia.media[0].cuts.keyFrame.url.includes('.gif')) {
                            reject(new Error('Keyframe url is a gif.'));
                        }

                        // update GBS section != null
                        if (query.includes('greatbigstory')) {
                            body.docs[0].section = body.docs[0].section ?  body.docs[0].section : 'gbs';
                        }

                        resolve(body);
                    }
                });
            } catch (error) {
                console.error(`Error in getBaseContentModel: ${JSON.stringify(error)}`);
            }
        });
    }



    /**
     * Gets the slides from Hypatia for a gallery query.
     *
     * @function ContentHelper#getGallerySlides
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
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                try {
                    request.get({json: true, url: url, timeout: timeout}, function (error, response, body) {
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
                    console.error(`Error in getGallery Slides: ${error}`);
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
     * @function ContentRetriever#getRelatedContent
     *
     * @public
     *
     * @param {Object} data
     * The base content model returned from `getBaseContentModel`.
     *
     * @returns {Promise}
     * Returns a promise with the complete content model on success or an error
     * message on failure.
     */
    getRelatedContent(data) {
        let self = this;

        /**
         * Loops though an array of paragraphs to fetch and referenced data.
         *
         * @private
         *
         * @param {Object} data
         * A Hyptia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processParagraphs(data, callback) {
            let index = 0;

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
                                    console.error(`ERROR5: ${JSON.stringify(error)}`);
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
                console.error(`Error in getRelatedContent::processParagraphs ${JSON.stringify(error)}`);
            }
        }


        /**
         * Loops though an array of relatedMedia to fetch and referenced data.
         *
         * @TODO - MAJOR - It feels like there should be a call to callback() somewhere in here
         *
         * @private
         *
         * @param {Object} data
         * A Hypatia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processRelatedMedia(data, callback) {
            let index = 0;

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
                                    console.error(`ERROR6: ${JSON.stringify(error)}`);
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
                                    console.error(`ERROR7: ${error.stack}`);
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

                // TODO - MAJOR - Should there be a callback() right here?

            } catch (error) {
                // TODO - MAJOR - Should there be a callback() right here?
                callback(error); // YES, there should be a callback hdre
                console.error(`Error in getRelatedContent::processRelatedMedia ${JSON.stringify(error)}`);
            }
        }


        /**
         * For a video content type (not an article content type), get the
         * .m3u8Url
         *
         * @private
         *
         * @param {Object} data
         * A Hyptia response object.
         *
         * @param {Function} callback
         * An async parallel callback function from getRelatedContent()
         */
        function processVideoContentType(data, callback) {
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
                        console.error(`ERROR8: ${JSON.stringify(error)}`);
                    });
                } else {
                    callback();
                }
            }
        }


        return new Promise(function (resolve, reject) {
            async.parallel([
                async.apply(processParagraphs, data),
                async.apply(processRelatedMedia, data),
                async.apply(processVideoContentType, data)
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
     * @function ContentHelper#getVideoUrl
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
        return new Promise(function (resolve, reject) {
            async.waterfall([function (done) {
                url = url.replace(/\s/g, '%20');

                console.log(`GETTING VIDEO XML: ${url}`);

                request.get({url: url, timeout: timeout}, function (error, response, body) {
                    if (error) {
                        console.error(`Error retrieving ${url}`);
                        done(error);
                    }

                    if (body) {
                        parseString(body, {trim: true}, function (err, result) {
                            let m3u8Url,
                                bitrate = (dataSource === 'cnn') ? 'hls_1080p' : 'ipadFile';

                            if (err) {
                                console.error(`Error parsing video xml: ${url} - ${err}`);
                                done(err);
                            } else {
                                console.log(`DATASOURCE FOR VIDEO XML PARSE IS: ${dataSource}`);

                                if (result && result.video && result.video.files && result.video.files[0].file && result.video.files[0].file.length > 0) {
                                    result.video.files[0].file.some(function (file) {
                                        console.log(`Comparing file.$.bitrate: ${file.$.bitrate} to bitrate: ${bitrate}`);
                                        if (file.$.bitrate === bitrate) {
                                            console.log(`MATCH FOUND: ${file._}`);
                                            m3u8Url = file._;
                                            return true;
                                        }
                                    });

                                    console.log(`RESOLVED m3u8Url: ${m3u8Url}`);
                                    done(null, m3u8Url);
                                } else {
                                    done(new Error(`${url} is blank or malformed.`));
                                }
                            }
                        });
                    } else {
                        console.error(`Error retrieving video xml for: ${url} with body: ${body}`);
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
}



module.exports = ContentRetriever;
