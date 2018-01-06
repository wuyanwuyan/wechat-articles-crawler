var serverUrl = 'http://{$IP}:9000';
var socket = io(serverUrl+'/wechat').connect(serverUrl);

socket.on('success', function () {
    var localIndex = window.localStorage.localIndex;
    var total = window.localStorage.total;
    clearInterval(key);
    clearTimeout(timeoutKey);
    $('#js_content').html("<label style='font-size: 30px;color:green'>提交成功 " + (parseInt(localIndex) + 1) + "/" + total + "</label>");
});

socket.on('url', function (data) {
    window.localStorage.localIndex = data.index;
    window.localStorage.total = data.total;
    window.location = data.url;
});

socket.on('end', function (data) {
    alert('该公众号爬取完毕');
});

var key, timeoutKey;

socket.on('connect', function () {
    key = setInterval(function () {
        var readNum = $('#readNum3').text().trim();

        if (!readNum) return;

        var likeNum = $('#likeNum3').text().trim();
        var postUser = $('#post-user').text().trim();
        var postDate = $('#post-date').text().trim() || $('#publish_time').text().trim();
        var activityName = $('#activity-name').text().trim();
        var js_share_source = $('#js_share_source').attr('href');


        socket.emit('crawler', {
            readNum: readNum,
            likeNum: likeNum,
            postUser: postUser,
            postDate: postDate,
            activityName: activityName,
            js_share_source: js_share_source
        });
    }, 1000);

    timeoutKey = setTimeout(function () {

        socket.emit('noData', {
            url: window.location.href,
            title: $('#activity-name').text().trim()
        });

        clearInterval(key);
        $('#js_content').html("<label style='font-size: 30px;color:red'>没有阅读数据? " + e + "</label>");

    }, 10000);
});
