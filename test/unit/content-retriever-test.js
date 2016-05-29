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


describe('Content Retriever', () => {
    before(() => {
        require('../mocks/nocks.js');
    });

    beforeEach(() => {
        this.randomNumber = Math.random();
        this.contentRetriever = new ContentRetriever(`${this.randomNumber}`);
    });

    afterEach(() => {
        delete this.randomNumber;
        delete this.contentRetriever;
    });



    it('should instantiate properly when created properly', () => {
        this.contentRetriever.should.be.an.instanceof(ContentRetriever);
    });



    describe('url property', () => {
        it('should have a url property that is set on instantiation', () => {
            this.contentRetriever.url.should.equal(`${this.randomNumber}`);
        });

        it('should return a value that is a String type', () => {
            this.contentRetriever.url.should.be.a('string');
        });
    });



    describe('timeout property', () => {
        it('should have a default value', () => {
            this.contentRetriever.timeout.should.equal(1000 * 5); // 5 seconds
        });

        it('should return a value that is a Number type', () => {
            this.contentRetriever.timeout.should.be.a('number');
        });

        it('should be set-able and get-able with a Number, like 20', () => {
            this.contentRetriever.timeout = 20;
            this.contentRetriever.timeout.should.equal(1000 * 20); // 20 seconds
        });

        it('should be set-able and get-able with a String (of a number), like "20"', () => {
            this.contentRetriever.timeout = '20';
            this.contentRetriever.timeout.should.be.a('number');
            this.contentRetriever.timeout.should.equal(1000 * 20); // 20 seconds
        });

        it('should be set to 1 if an attempt to set it to 0 is made', () => {
            this.contentRetriever.timeout = 0;
            this.contentRetriever.timeout.should.equal(1000); // 1 second
        });
    });



    describe('hypatiaHost property', () => {
        it('should have a default value', () => {
            this.contentRetriever.hypatiaHost.should.equal('http://hypatia.api.cnn.com/');
        });

        it('should return a value that is a String type', () => {
            this.contentRetriever.hypatiaHost.should.be.a('string');
        });

        it('should be set-able and get-able', () => {
            this.contentRetriever.hypatiaHost = 'foo';
            this.contentRetriever.hypatiaHost.should.equal('foo');
        });
    });



    describe('hypatiaRoute property', () => {
        it('should have a default value', () => {
            this.contentRetriever.hypatiaRoute.should.equal('svc/content/v2/search/collection1/');
        });

        it('should be set-able and get-able', () => {
            this.contentRetriever.hypatiaRoute = 'foo';
            this.contentRetriever.hypatiaRoute.should.equal('foo'); // 20 seconds
        });
    });



    describe('getBaseContentModel', () => {
        it('should return an error if the request to hypatia is not found', () => {
            // nock #5
            delete this.contentRetriever;
            this.contentRetriever = new ContentRetriever('http://www.cnn.com/2016/02/12/foodanddrink/how-to-cook-perfect-steak/index.html');
            this.contentRetriever.hypatiaHost = 'http://hypatia.cnn.com/'; // this doesn't exist
            return this.contentRetriever.getBaseContentModel().should.be.rejectedWith('ENOTFOUND');
        });

        it('should return a promise', () => {
            // nock #5
            delete this.contentRetriever;
            this.contentRetriever = new ContentRetriever('http://www.cnn.com/2016/02/12/foodanddrink/how-to-cook-perfect-steak/index.html');
            return this.contentRetriever.getBaseContentModel().should.be.fulfilled;
        });

        it('should return an error if no documents are returned from Hypatia', () => {
            // nock #6
            delete this.contentRetriever;
            this.contentRetriever = new ContentRetriever('http://www.cnn.com/2016/02/12/foodanddrink/how-to-cook-perfect-steak/not-found');
            return this.contentRetriever.getBaseContentModel().should.be.rejectedWith('Error: no content found');
        });
    });



    describe('getGallerySlides', () => {
        it('should return an error if the request to hypatia is not found', () => {
            return this.contentRetriever.getGallerySlides('http://hypatia.cnn.com/').should.be.rejectedWith('ENOTFOUND');
        });

        it('should return a promise', () => {
            // nock #7
            let url = 'http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/id:h_848a90683d9333f8904d558b12025844';
            return this.contentRetriever.getGallerySlides(url).should.be.fulfilled;
        });

        it('should return an error if the url is not valid', () => {
            // nock #8
            let url = 'http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/id:i-dont-exist';
            return this.contentRetriever.getGallerySlides(url).should.be.rejectedWith('Error: No slides in gallery');
        });
    });



    describe('getRelatedContent', () => {
        it('should return a promise when parsing a gallery with no paragraphs', () => {
            const data = require('../mocks/gallery.json');
            return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        });

        // it('should return an error if an error happens and I have no idea how to test that')
    });



    describe('getVideoUrl', () => {
        it('should return a promise', () => {
            // nock #1
            const url = 'http://www.cnn.com/video/data/3.0/video/health/2016/03/21/zika-animation-dr-sanjay-gupta-ts-orig.cnn/index.xml';
            return this.contentRetriever.getVideoUrl(url, 'cnn').should.be.fulfilled;
        });


        it('should return a proper m3u8 url for CNN videos', () => {
            // nock #1
            const url = 'http://www.cnn.com/video/data/3.0/video/health/2016/03/21/zika-animation-dr-sanjay-gupta-ts-orig.cnn/index.xml',
                expectedResult = 'http://cnnios-f.akamaihd.net/i/cnn/big/health/2016/03/21/zika-animation-dr-sanjay-gupta-ts-orig.cnn_380824_ios_,150,440,650,840,1240,3000,5500,.mp4.csmil/master.m3u8?__b__=650';
            return this.contentRetriever.getVideoUrl(url, 'cnn').should.eventually.equal(expectedResult);
        });


        it('should return a proper m3u8 url for CNN$ videos', () => {
            // nock #2
            const url = 'http://money.cnn.com/video/data/4.0/video/technology/2016/04/12/facebook-f8-2016-mark-zuckerberg.cnnmoney.xml',
                expectedResult = 'http://money-i.akamaihd.net/i/money/big/technology/2016/04/12/facebook-f8-2016-mark-zuckerberg.cnnmoney_ios_,audio,150,440,650,840,1240,.mp4.csmil/master.m3u8?__b__=650';
            return this.contentRetriever.getVideoUrl(url, 'money').should.eventually.equal(expectedResult);
        });


        it('should return an error if the xml url protocol is invalid', () => {
            return this.contentRetriever.getVideoUrl('ht://invalid-url', 'cnn').should.be.rejectedWith('Error: Invalid protocol');
        });


        it('should return an error if the xml url is invalid', () => {
            return this.contentRetriever.getVideoUrl('not-a-url-at-all', 'cnn').should.be.rejectedWith('Error: Invalid URI');
        });


        it('should return an error if the xml url is blank', () => {
            return this.contentRetriever.getVideoUrl('', 'cnn').should.be.rejectedWith('Error: options.uri is a required argument');
        });


        it('should return an error if the returned xml is invalid', () => {
            // nock #3
            return this.contentRetriever.getVideoUrl('http://www.cnn.com/invalid-xml-test/index.xml', 'cnn').should.be.rejectedWith('Error: ');
        });


        it('should return an error if the returned xml is blanked out (and still structured)', () => {
            // nock #4 - this happens when a video is "removed"
            return this.contentRetriever.getVideoUrl('http://www.cnn.com/blank-xml-test/index.xml', 'cnn').should.be.rejectedWith('Error: ');
        });
    });



    describe.skip('processParagraphs', () => {
        // it('should process paragraphs that do not have any embeds', () => {
        //     const data = require('../mocks/cnn-article.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        //
        // // nock #9
        // it('should process paragraphs that do have embeds that are not galleries', () => {
        //     const data = require('../mocks/cnn-politics-article.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });


        // it('cnn-article', () => {
        //     const data = require('../mocks/cnn-article.json');          // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-gallery', () => {
        //     const data = require('../mocks/cnn-gallery.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-money-article', () => {
        //     // nock #9
        //     const data = require('../mocks/cnn-money-article.json');    // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-photos-article', () => {
        //     // nock #10
        //     const data = require('../mocks/cnn-photos-article.json');   // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-politics-article', () => {
        //     // nock #11
        //     const data = require('../mocks/cnn-politics-article.json'); // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-politics-gallery', () => {
        //     const data = require('../mocks/cnn-politics-gallery.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-politics-video', () => {
        //     // nock #12
        //     const data = require('../mocks/cnn-politics-video.json');   // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-style-article', () => {
        //     // nock #13, #14
        //     const data = require('../mocks/cnn-style-article.json');    // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-style-gallery', () => {
        //     const data = require('../mocks/cnn-style-gallery.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-style-video', () => {
        //     // nock #15
        //     const data = require('../mocks/cnn-style-video.json');      // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('cnn-video', () => {
        //     // nock #16
        //     const data = require('../mocks/cnn-video.json');            // nock required
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
        // it('gallery', () => {
        //     const data = require('../mocks/gallery.json');
        //     return this.contentRetriever.getRelatedContent(data).should.be.fulfilled;
        // });
    });


});
