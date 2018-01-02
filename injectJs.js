var scrollSpeed = 0.3;
var $scroll = $("html, body");
var stopScroll = false;
function scrollBottom(callBack) {
    if(stopScroll) return;
    var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    var detalTop = $(document).height() - scrollTop;
    $scroll.animate({scrollTop: $(document).height()}, detalTop/scrollSpeed, function () {
        scrollBottom(scrollBottom);
    });

    // if($('#js_loading').length === 0){
    //     stopScroll = true;
    // }
};


var socket = io.connect('http://192.168.1.100:9000');
socket.on('news', function (data) {
    console.log(data);
    setInterval(function () {
        socket.emit('my other event', { my: Math.random() });
    },2000)
});

socket.on('scroll', function (data) {
    $scroll.stop(true);
    $scroll.animate({scrollTop: $(document).height()}, 4000);
});

socket.on('url', function (data) {
    window.localStorage.localIndex = data.index;
    if('total' in data) window.localStorage.total = data.total;
    window.location = data.url;
});

socket.on('stopScroll',function (data) {
    stopScroll = true;
    $scroll.stop(true);
});

$(window).on('load', function () {
    scrollBottom();
});