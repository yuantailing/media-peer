
var worker;
var sampleImageData;
var sampleVideoData;
var outputElement;
var filesElement;
var running = false;
var isWorkerLoaded = false;
var isSupported = (function() {
  return document.querySelector && window.URL && window.Worker;
})();

function isReady() {
  return !running && isWorkerLoaded;
}

function startRunning() {
  //document.querySelector("#image-loader").style.visibility = "visible";
  running = true;
}
function stopRunning() {
  //document.querySelector("#image-loader").style.visibility = "hidden";
  running = false;
}

function retrieveSampleImage() {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", "bigbuckbunny.jpg", true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      sampleImageData = new Uint8Array(arrayBuffer);
    }
  };

  oReq.send(null);
}

function retrieveSampleVideo() {
  var oReq = new XMLHttpRequest();
  oReq.open("GET", "bigbuckbunny.webm", true);
  oReq.responseType = "arraybuffer";

  oReq.onload = function (oEvent) {
    var arrayBuffer = oReq.response;
    if (arrayBuffer) {
      sampleVideoData = new Uint8Array(arrayBuffer);
    }
  };

  oReq.send(null);


}

function parseArguments(text) {
  text = text.replace(/\s+/g, ' ');
  var args = [];
  // Allow double quotes to not split args.
  text.split('"').forEach(function(t, i) {
    t = t.trim();
    if ((i % 2) === 1) {
      args.push(t);
    } else {
      args = args.concat(t.split(" "));
    }
  });
  return args;
}


function runCommand(text) {
  if (isReady()) {
    startRunning();
    var args = parseArguments(text);
    console.log(args);
    worker.postMessage({
      type: "command",
      arguments: args,
      files: [
        {
          "name": "input.jpeg",
          "data": sampleImageData
        },
        {
          "name": "input.webm",
          "data": sampleVideoData
        }
      ]
    });
  }
}

function myCommand(text, files, cb) {
  if (isReady()) {
    window.ffmpeg_cb = cb;
    window.ffmpeg_info = {total:0, segs:[]};
    startRunning();
    var args = parseArguments(text);
    console.log(args);
    worker.postMessage({
      type: "command",
      arguments: args,
      files: files
    });
  }
}

window.myCommand = myCommand;

function getDownloadLink(fileData, fileName) {
  if (fileName.match(/\.jpeg|\.gif|\.jpg|\.png/)) {
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    var img = document.createElement('img');

    img.src = src;
    return img;
  }
  else {
    var a = document.createElement('a');
    a.download = fileName;
    var blob = new Blob([fileData]);
    var src = window.URL.createObjectURL(blob);
    a.href = src;
    a.textContent = 'Click here to download ' + fileName + "!";
    return a;
  }
}

function initWorker() {
  worker = new Worker("/demo/worker-asm.js");
  worker.onmessage = function (event) {
    var message = event.data;
    if (message.type == "ready") {
      isWorkerLoaded = true;
      worker.postMessage({
        type: "command",
        arguments: ["-help"]
      });
    } else if (message.type == "stdout") {
      //outputElement.textContent += message.data + "\n";
      if (message.data.startsWith("  Duration")) {
          var tt = message.data.substr(12,11);
          console.log("get duration");
          console.log(tt);
          var h = parseFloat(tt.substr(0,2));
          var m = parseFloat(tt.substr(3,2));
          var s = parseFloat(tt.substr(6,5));
          console.log(h*60*60 + m*60 + s);
          window.ffmpeg_info.total = h*60*60 + m*60 + s;
      } else if (message.data.indexOf("starts with packet") >= 0) {
          tt = parseFloat(message.data.split("pts_time:")[1].split(" ")[0]);
          console.log("get pts " + tt);
          window.ffmpeg_info.segs.push(tt);
      }
      console.log( message.data + "\n");
    } else if (message.type == "start") {
      //outputElement.textContent = "Worker has received command\n";
      console.log("Worker has received command\n");
    } else if (message.type == "done") {
      stopRunning();
      var buffers = message.data;
      if (buffers.length) {
        //outputElement.className = "closed";
      }
      if (window.ffmpeg_cb) {
          window.ffmpeg_cb(buffers, window.ffmpeg_info);
      }
      buffers.forEach(function(file) {
        //filesElement.appendChild(getDownloadLink(file.data, file.name));
      });
    }
  };
}
