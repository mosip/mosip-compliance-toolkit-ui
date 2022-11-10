// The mjpeg url.
//const url = "http://127.0.0.1:4501/stream";

//JPEG starting bytes
const SOI = new Uint8Array(3);
SOI[0] = 0xff;
SOI[1] = 0xdb;
SOI[2] = 0xd8;
const CONTENT_LENGTH = "CONTENT-LENGTH";
const TYPE_JPEG = "image/jpeg";

let controller = new AbortController();

function stop_streaming() {
  controller.abort();
  controller = new AbortController();
}

function start_streaming(url, dId, dSubId, tagId) {
  interrupt = false;
  var obj = { deviceId: dId, deviceSubId: dSubId };
  fetch(url, {
    method: "STREAM",
    body: JSON.stringify(obj),
    keepalive: true,
    headers:
      typeof Headers !== "undefined"
        ? new Headers({ "content-type": "text/plain" })
        : { "content-type": "text/plain" },
  })
    .then((response) => {
      if (!response.ok) {
        throw Error(response.status + " " + response.statusText);
      }

      if (!response.body) {
        throw Error("ReadableStream not yet supported in this browser.");
      }

      const reader = response.body.getReader();

      let headers = "";
      let contentLength = -1;
      let imageBuffer = null;
      let bytesRead = 0;

      let reader1 = new FileReader();

      reader1.onload = function () {
        //let data = reader1.result; // data url
        //console.log("data URL >>> " + data);
        document.getElementById(tagId).src = reader1.result;
      };

      // calculating fps. This is pretty lame. Should probably implement a floating window function.
      let frames = 0;

      /* setInterval(() => {
              console.log("fps : " + frames);
              frames = 0;
          }, 1000)*/

      const read = () => {
        reader
          .read()
          .then(({ done, value }) => {
            if (done) {
              controller.abort();
              return;
            }

            for (let index = 0; index < value.length; index++) {
              // we've found start of the frame. Everything we've read till now is the header.
              if (value[index] === SOI[0] && value[index + 1] === SOI[2]) {
                //console.log('JPEG SOI marker found : ' + headers);
                contentLength = getLength(headers);
                // console.log("Content Length : " + newContentLength);
                imageBuffer = new Uint8Array(contentLength);
              }
              // we're still reading the header.
              if (contentLength <= 0) {
                headers += String.fromCharCode(value[index]);
              }
              // we're now reading the jpeg.
              else if (bytesRead < contentLength) {
                imageBuffer[bytesRead++] = value[index];
              }
              // we're done reading the jpeg. Time to render it.
              else {
                //console.log("jpeg read with bytes : " + bytesRead);
                //URL.revokeObjectURL(document.getElementById('image').src);
                let blob = new Blob([imageBuffer.buffer], { type: TYPE_JPEG });
                //document.getElementById('image').src = URL.createObjectURL(blob);
                reader1.readAsDataURL(blob); // converts the blob to base64 and calls onload
                frames++;
                contentLength = 0;
                bytesRead = 0;
                headers = "";
              }
            }

            read();
          })
          .catch((error) => {
            console.error(error);
          });
      };

      read();
    })
    .catch((error) => {
      console.error(error);
    });
}

const getLength = (headers) => {
  let contentLength = 0;
  var parts = headers.split("\r\n");
  headers.split("\r\n").forEach((header, _) => {
    const pair = header.split(":");
    if (pair[0].toUpperCase() === CONTENT_LENGTH) {
      contentLength = parseInt(pair[1], 10);
    }
  });
  return contentLength;
};
