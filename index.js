var $ = require('zepto-browserify').$;
var Promise = require('bluebird');
var url = require('url');

var S3Mixin = {
  startUpload: function (file, filePath) {
    var _this = this;
    if (!file)
      alert("No file selected");

    return this.getSignedRequest(file, filePath)
      .then(function (response) {
        return Promise.resolve(_this.uploadToS3(file, response.signed_request, response.url));
      })
      .then(function (xhr) {
        var parsedUrl   = url.parse(xhr.responseURL);
        var resourceUrl = parsedUrl.protocol + '//' + parsedUrl.hostname + parsedUrl.pathname;
        return Promise.resolve(resourceUrl);
      });
  },

  getSignedRequest: function (file, filePath) {
    return Promise.resolve(
      $.ajax({
        type: 'GET',
        url: '/api/sign_s3', //REPLACE with your api end point
        data: {file_name: filePath + file.name, file_type: file.type},
      });
    );
  },

  directUploadToS3: function (file, signedRequest, url) {
    var _this = this;

    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("PUT", signedRequest);
      //IMPORTANT
      //The xhr HEADERS must be the same as the headers used to generate the signed request.

      xhr.setRequestHeader('x-amz-acl', 'public-read');
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('Expires', 600);

      xhr.onload = function () {
        var headers = xhr.getAllResponseHeaders().toLowerCase();
        if (xhr.status === 200)
          resolve(xhr);
      };
      xhr.onerror = function () {
        reject(xhr.error);
      };
      xhr.upload.addEventListener('progress', function(e) {
        if (e.lengthComputable) {
          var percentComplete = e.loaded / e.total;
          var value = percentComplete * 100;
          _this.progress.value = value;
        }
      })
      xhr.send(file.slice());
    });
  },

};

module.exports = S3Mixin;

