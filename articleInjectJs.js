
var scrollSpeed = 0.6;
var $scroll = $("html, body");
function scrollBottom(callBack) {
    var scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
    var detalTop = $(document).height() - scrollTop;
    $scroll.animate({scrollTop: $(document).height()}, 4000);
};

// $.post()

var serverUrl = "http://192.168.1.100:9000";
var socket = io.connect(serverUrl);
socket.on('news', function (data) {
    console.log(data);
    setInterval(function () {
        socket.emit('my other event', {my: Math.random()});
    }, 2000)
});

socket.on('url', function (data) {
    window.localStorage.localIndex = data.index;
    if('total' in data) window.localStorage.total = data.total;
    window.location = data.url;
});

socket.on('end', function (data) {
   alert('改公众号爬取完毕');
});

$(window).on('load', function () {
    scrollBottom();
});

var key = setInterval(function () {

    // $("script").remove();
    // $("#js_content").remove();
    //
    // // var innerhtml = $('body').html();
    // // var index = innerhtml.lastIndexOf('投诉');
    // // var ret = innerhtml.substr(index - 400, index + 400);

    var readNum = $('#readNum3').text().trim();

    if (readNum) {

        var likeNum = $('#likeNum3').text().trim();
        var postUser = $('#post-user').text().trim();
        var postDate = $('#post-date').text().trim();
        var activityName = $('#activity-name').text().trim();

        $.ajax({
            type: 'POST',
            url: serverUrl + "/crawler",
            data: {
                readNum: readNum,
                likeNum: likeNum,
                postUser: postUser,
                postDate: postDate,
                activityName: activityName
            },
            datatype: 'json',
            success: function () {
                var localIndex = window.localStorage.localIndex;
                var total = window.localStorage.total;
                clearInterval(key);
                $('body').html("<label style='font-size: 30px;color:green'>提交成功 "+ (parseInt(localIndex)+1) + "/" + total + "</label>");
            },
            error: function () {
                alert('提交失败');
            }
        });
    }
}, 2000);

setTimeout(function () {
    $.ajax({
        type: 'POST',
        url: serverUrl + "/noData",
        data: {
            url: window.location.href,
            title:$('#activity-name').text().trim()
        },
        datatype: 'json',
        success: function () {
            alert('没有阅读数据？');
        },
        error: function () {
            alert('error 没有阅读数据？');
        }
    });
},10000);

