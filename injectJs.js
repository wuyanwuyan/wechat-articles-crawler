var scrollKey = setInterval(function () {
    window.scrollTo(0,document.body.scrollHeight);
},1000);

var serverUrl = 'http://{$IP}:9000';
var socket = io.connect(serverUrl,function () {
    
});

socket.on('url', function (data) {
    clearInterval(scrollKey);
    window.localStorage.localIndex = data.index;
    window.localStorage.total = data.total;
    window.location = data.url;
});

