const { Readability } = require("@mozilla/readability");
const axios = require('axios').default;
const JSDOM = require('jsdom').JSDOM;
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.handler = async (event) => {
  console.log('request: ' + JSON.stringify(event));
  let body;
  if (event.body) {
    body = JSON.parse(event.body);
  }

  let articleUrl;
  if (body) {
    articleUrl = body.url;
  }

  let readerView;
  let response;
  try {
    if (articleUrl) {
      console.log('url: ' + articleUrl);
      const articleSite = await axios.get(articleUrl);
      const vdom = new JSDOM(articleSite.data)
      const reader = new Readability(vdom.window.document);
      readerView = reader.parse();
    }

    const destparams = {
      Bucket: 'readdy-ate-content',
      Key: readerView.title + '.txt',
      Body: readerView.textContent,
      ContentType: 'text',
    };

    await s3.putObject(destparams).promise();
  } catch (error) {
    console.log(error);
    response = {
        statusCode: 500,
        body: JSON.stringify({
          data: {
            msg: 'Error: ' + error,
          },
        }),
      };
    return response;
  }

  response = {
    statusCode: 200,
    body: JSON.stringify({
      data: {
        msg: 'Processing is complete: ' + readerView.title + '.txt',
      },
    }),
  };

  return response;
};
