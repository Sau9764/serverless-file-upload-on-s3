"use strict";

const middy = require('@middy/core')
const AWS = require("aws-sdk");
const { v4 } = require("uuid");
const s3 = new AWS.S3()
const formParser = require("./formParser");
const httpJsonBodyParser = require('@middy/http-json-body-parser')

const bucket = 'image-upload-serverless';
const MAX_SIZE = 20 * 1024 * 1024; // 4MB

const PNG_MIME_TYPE = "image/png";
const JPEG_MIME_TYPE = "image/jpeg";
const JPG_MIME_TYPE = "image/jpg";

const MIME_TYPES = [PNG_MIME_TYPE, JPEG_MIME_TYPE, JPG_MIME_TYPE];

const fileUploaderHome = async (event) => {
  try {
    const formData = await formParser.parser(event, MAX_SIZE);
    const file = formData.files[0];

    if (!isAllowedFile(file.content.byteLength, file.contentType))
      getErrorMessage("File size or type not allowed");

    const uid = v4();

    const originalKey = `${uid}_original_${file.filename}`;
  
    // const [ originalFile ] = await Promise.all([(uploadToS3(bucket, originalKey, file.content, file.contentType))])

    const originalFile = await uploadToS3(bucket, originalKey, file.content, file.contentType)

    console.log(originalFile)

    const signedOriginalUrl = await s3.getSignedUrl("getObject", {
      Bucket: bucket,
      Key: originalKey,
      Expires: 60000
    })

    console.log(signedOriginalUrl)

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: uid,
        mimeType: file.contentType,
        originalKey: originalKey,
        bucket: bucket,
        fileName: file.filename,
        originalUrl: signedOriginalUrl,
        originalSize: file.content.byteLength
      })
    };
  } catch (e) {
    return getErrorMessage(e.message);
  }
};

const getErrorMessage = message => ({
  statusCode: 500,
  body: JSON.stringify({
    message
  })
});

const isAllowedSize = size => size <= MAX_SIZE;

const isAllowedMimeType = mimeType =>
  MIME_TYPES.find(type => type === mimeType);

const isAllowedFile = (size, mimeType) =>
  isAllowedSize(size) && isAllowedMimeType(mimeType);

// const uploadToS3 = async (bucket, key, buffer, mimeType) =>
//   new Promise((resolve, reject) => {
//     s3.upload(
//       {
//         Bucket: bucket,
//         Key: key,
//         Body: buffer,
//         ContentType: mimeType
//       },
//       function(err, data) {
//         if (err) reject(err);
//         resolve(data);
//       }
//     );
//   });

const uploadToS3 = async (bucket, key, buffer, mimeType) => {
  await s3.upload({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }).promise()
}

module.exports = {
  handler: fileUploaderHome
}