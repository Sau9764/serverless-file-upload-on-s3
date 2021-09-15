const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const s3 = new AWS.S3();

const getSignedURL = async (event) => {
  
  try {

    const key = uuidv4() + '.jpg';
    const expireSeconds = 60 * 5; // 5min
 
    const s3params = {
      Bucket: process.env.Bucket,
      Key: key,
      Expires: expireSeconds,
      ContentType: 'image/jpeg'
    }

    const url = await s3.getSignedUrl("putObject", s3params);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ Url: url, Key: key }),
    };

  } catch (err) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({ err }),
    };
  }
};

module.exports = { 
  handler: getSignedURL
}