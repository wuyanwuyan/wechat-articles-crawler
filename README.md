# 基于anyproxy的微信公众号文章爬取，包含阅读数点赞数

录制的视频：[点击前往](http://v.youku.com/v_show/id_XMzUwMzE4OTM1Mg==.html?spm=a2hzp.8244740.0.0)

[![Watch the video](https://vthumb.ykimg.com/054104085ABE60F3000001056004F443)](http://v.youku.com/v_show/id_XMzUwMzE4OTM1Mg==.html?spm=a2hzp.8244740.0.0)

## 基本原理
1. [AnyProxy](http://anyproxy.io/cn/)是一个阿里开源的HTTP代理服务器，类似fiddler和charles，但是提供了二次开发能力，可以编写js代码改变http/https请求和响应
2. 为了爬取一个微信公众号的全部文章，首先就是获取全部文章，然后一篇一篇去打开获取文章标题，作者，阅读数，点赞数（阅读点赞数只能在微信app内置浏览器获取）
3. 每个微信公众号都提供`查看历史消息`的功能，点击去打开这个网页，不停下滚，可以查到全部发布文章。在这一步，基于anyproxy，修改了这个网页html，注入一段让页面不停往下滚动的js脚本，当滚到底部，就获取了全部文章列表。 本质上是中间人攻击。
4. 获取完全部文章的内容（包括url，标题，发布时间等等）后，下一步就是循环通知微信浏览器一个一个去打开这些文章网页。每个文章网页也注入js脚本，功能是不停的检查页面的点赞数和阅读数，检测到，就往某服务器发，后台每成功收到一个文章的点赞数和阅读数，就通知微信浏览器打开下一个url。这里我使用了socketio，实现微信浏览器和自建的koa服务器之间的通讯。

如图所示：


<p align="center">
  <span>获取文章列表演示: </span><br>
  <img src="http://upload-images.jianshu.io/upload_images/2058960-968978f9198c86ef.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240">
</p>


<p align="center">
  <span>一篇一篇打开文章链接: </span><br>
  <img src="http://upload-images.jianshu.io/upload_images/2058960-0f035da769523276.gif?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240">
</p>


## 如何运行
第一步，一定要安装成功anyproxy，这一步请详细阅读[anyproxy的官方教程](http://anyproxy.io/cn/)，写的很详细，要保证能成功代理https，能查看到https的body内容。

```
yarn install
yarn start
```
会自动打开一个result.html，实时查看爬取文章的内容
点击一个微信公众号，点击查看历史消息，之后历史页面会不停的滚动到底，滚动完毕，就开始一篇一篇打开文章，爬取内容。
![实时结果显示](http://upload-images.jianshu.io/upload_images/2058960-da9d9bae50979ad3.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/800)


## 具体过程
1.第一步，要获取一个公众号的全部历史文章。在已经设置好anyproxy代理的真机上，查看历史消息，这时微信会打开历史文章网页。
获取一个html文档：
![](http://upload-images.jianshu.io/upload_images/2058960-9830eb06c47ed549.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/800)
，`var msgList`就是我们需要的历史文章数据，简单正则匹配出来，替代非法字符，JSON.parse转成我们需要的格式。 基于anyproxy，我们给这个html文档注入一段脚本，目的是让这个网页不停的往下自己滚动，触发浏览器去获得更多的文章。
```javascript
var scrollKey = setInterval(function () {
    window.scrollTo(0,document.body.scrollHeight);
},1000);
```
当网页滚到底，再次获取文章，这个时候，同样的是get请求，但是返回了Content-Type为`application/json`的格式，这里同样的方法，正则匹配找出并格式化成我们需要的格式


![](http://upload-images.jianshu.io/upload_images/2058960-bf19d52ee8071a0f.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
同时当`can_msg_continue`为0时，表示已经拉到底，获取了全部文章。


至此，获得了一个公众号的全部文章，包括文章标题，作者，url。但是没有阅读数和点赞数，这需要打开具体的文章链接，才能看得到。

2. 我们还没获得阅读数和点赞数，接下来就是一步一步让微信浏览器不停地打开具体文章，触发微信浏览器获取阅读数和点赞数。这里使用了socket.io，让文章页面连接自定义的服务器，服务器主动通知浏览器下一个点开的文章链接，这样双向通讯，一个循环就能获取具体文章的阅读数和点赞。
``` javascript
socket.on('url', function (data) {
    window.location = data.url;
});
```
阅读数和点赞可以在浏览器端，不停检查dom元素是否渲染出来然后收集发往服务器，也可以直接anyproxy检查出来（这里我采用前一种）。
``` javascript
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
````



![post响应中的阅读数和点赞数](http://upload-images.jianshu.io/upload_images/2058960-03c536e58a47f047.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/800)



## 实践过程的注意点
原理很简单，基于真机的爬虫，中间人攻击，注入javascript脚本，让浏览器模拟人的操作过程。

1. 禁止网页的Content-Security-Policy。CSP 的实质就是白名单制度，开发者明确告诉客户端，哪些外部资源可以加载和执行，等同于提供白名单。如果不禁用，注入的javascript将无法执行。这里的做法，简单粗暴的删除http响应的任何和csp有关的头部。
``` javascript
 // 删除微信网页的安全策略
delete header['Content-Security-Policy'];
delete header['Content-Security-Policy-Report-Only'];
```


![删除和scp有关的header.jpg](http://upload-images.jianshu.io/upload_images/2058960-b39d4167e3039a28.jpg?imageMogr2/auto-orient/strip%7CimageView2/2/w/800)


2. 禁止微信浏览器缓存页面内容，同样要修改响应头的和缓存相关的内容。
```javascript
 header['Expires'] = 0;
 header['Cache-Control'] = 'no-cache, no-store, must-revalidate';
```
