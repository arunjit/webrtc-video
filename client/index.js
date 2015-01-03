
;(function() {
var WIDTH = 640;
var HEIGHT = 480;

navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia);
// var URL = window.URL || window.webkitURL;
// var requestAnimationFrame = (window.requestAnimationFrame || window.webkitRequestAnimationFrame);
// var cancelAnimationFrame = (window.cancelAnimationFrame || window.webkitCancelAnimationFrame);

var socket = io('//localhost:3000');
var video = document.getElementById('video');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
var startButton = document.getElementById('start-btn');
var stopButton = document.getElementById('stop-btn');
var streaming = false;
var videoStream;

// Helpers
function log() {
  console.log.apply(console, arguments);
}

function hide(el) {
  el.setAttribute('hidden', '');
}

function show(el) {
  el.removeAttribute('hidden');
}

// Work
var streamTime = null;
function streamFn() {
  if (!streaming) return;
  requestAnimationFrame(streamFn);

  // Throttle to ~25fps
  var now = Date.now();
  if (streamTime && (now - streamTime) < 40) return;
  streamTime = now;

  log('computing frame...');
  context.drawImage(video, 0, 0, WIDTH, HEIGHT);
  var imageData = context.getImageData(0, 0, WIDTH, HEIGHT).data;
  log('size:', imageData.length);
  var data = [];
  for (var i = 0; i < imageData.length; i+=8) {  // skip alternate pixels
    var pixel = (imageData[i+2]&0xff)<<4 |
                (imageData[i+1]&0xff)<<2 |
                (imageData[i]&0xff);
    data.push(pixel);
  }
  // socket.emit('chunk', data);
  log('chunk', data);
}

function startStreaming() {
  log('streaming...');
  streamTime = Date.now();
  streamFn();
}

function stopStreaming() {
  cancelAnimationFrame(streamFn);
  streaming = false;
  video.src = '';
  (videoStream && videoStream.stop) && videoStream.stop();
  show(startButton);
  hide(stopButton);
}

function askForCamera() {
  navigator.getUserMedia({video: true, audio: false}, function(stream) {
    videoStream = stream;
    video.src = URL.createObjectURL(stream);
    video.play();
    hide(startButton);
    show(stopButton);
  },
  function(err) {
    log("ERR:", err);
  });
}


// Events
socket.on('connect', function() {
  log('connected!');
  show(startButton);
});

socket.on('data', function(data) {
  log('data:', data);
});

socket.on('disconnect', function() {
  log('disconnected :/');
});

video.addEventListener('canplay', function() {
  if (!streaming) {
    streaming = true;
    startStreaming();
  }
}, false);

startButton.addEventListener('click', function() {
  askForCamera();
});

stopButton.addEventListener('click', function() {
  stopStreaming();
});

})();
