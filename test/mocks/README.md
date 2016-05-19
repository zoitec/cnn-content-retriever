# Mocks

Don't edit these files.  Run a query to get a new model from Hypatia if they
need to be updated.

1. Get a url - if you need one different than what is listed in this file.
2. URL Encode it - hint: http://meyerweb.com/eric/tools/dencoder/
3. Paste the url encoded url after the `url:` in the cURL request


### Examples
This assumes you are in the root of the KSA project.  Don't bother trying to
copy/paste all of these at once.  It won't work.

```shell
curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2012%2F10%2F04%2Fshowbiz%2Fgallery%2F50-years-of-bond%2Findex.html > test/mocks/gallery.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F08%2F18%2Ftravel%2Fstar-wars-plane-ana-feat%2Findex.html > test/mocks/cnn-article.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2Fvideos%2Fliving%2F2015%2F08%2F19%2Fgroom-wedding-dance-viral-orig.ginger-topham > test/mocks/cnn-video.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F04%2F17%2Ftravel%2Fgallery%2Fana-star-wars-livery%2Findex.html > test/mocks/cnn-gallery.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fmoney.cnn.com%2F2015%2F08%2F20%2Fnews%2Fhello-kitty-sanrio-business%2Findex.html > test/mocks/cnn-money-article.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F08%2F20%2Farts%2Fbanksy-dismaland-art-exhibition%2Findex.html > test/mocks/cnn-style-article.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2Fvideos%2Farts%2F2015%2F08%2F18%2Fcantonese-macbeth-shakespeare-london-style.cnn > test/mocks/cnn-style-video.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F08%2F17%2Ffashion%2Fgallery%2Fdr-martens-55-years-counter-culture%2Findex.html > test/mocks/cnn-style-gallery.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F08%2F21%2Fpolitics%2Fted-cruz-2016-heidi-cruz-fundraiser%2Findex.html > test/mocks/cnn-politics-article.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2Fvideos%2Fpolitics%2F2015%2F08%2F20%2Fjimmy-carter-cancer-announcement-key-moments-ar-origwx.cnn > test/mocks/cnn-politics-video.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F03%2F18%2Fpolitics%2Fgallery%2Fted-cruz-photos-senate-life-election-2016%2Findex.html > test/mocks/cnn-politics-gallery.json

curl -sS http://ref.hypatia.services.dmtio.net/svc/content/v2/search/collection1/url:http%3A%2F%2Fwww.cnn.com%2F2015%2F08%2F20%2Fus%2Fcnnphotos-mardi-gras-indians-new-orleans%2Findex.html > test/mocks/cnn-photos-article.json
```
