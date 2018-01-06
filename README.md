# 基于anyproxy的微信公众号文章爬取，包含阅读数点赞数


https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI2NDk5NzA0Mw==&scene=124&devicetype=android-23&version=26060133&lang=zh_CN&nettype=WIFI&a8scene=3&pass_ticket=vIi%2FguDSA6A%2BI5NiPHexQqF9MLRKvFaOgNl3YKJhn6UEvb6LubhoEAG87Gvcxou%2B&wx_header=1

https://mp.weixin.qq.com/mp/profile_ext?action=getmsg&__biz=MzI2NDk5NzA0Mw==&f=json&offset=10&count=10&is_ok=1&scene=124&uin=777&key=777&pass_ticket=vIi%2FguDSA6A%2BI5NiPHexQqF9MLRKvFaOgNl3YKJhn6UEvb6LubhoEAG87Gvcxou%2B&wxtoken=&appmsg_token=938_j1jp%252BCmq%252Ftu0ETX%252FswVjO7ne-UgeQhaeoiX4KQ~~&x5=1&f=json

## 基本原理
1. AnyProxy是一个阿里开源的HTTP代理服务器，类似fiddler和charles，但是提供了二次开发能力，可以编写js代码改变http/https请求和响应
2. 为了爬取一个微信公众号的全部文章，无非就是获取全部文章，然后一篇一篇去打开获取文章标题，作者，阅读数，点赞数（这两个只能在微信浏览器获取）
3. 每个微信公众号都提供`查看历史消息`的功能，点击去打开这个网页，不停下滚，可以查到全部发布文章。在这一步，基于anyproxy，修改了这个网页html，注入一段让页面不停往下滚动的js脚本，当滚到底部，自然就获取了全部文章列表。 这就是中间人攻击，类似运营商给你网页右下角弹个广告。
4. 获取完全部文章的内容（包括url，标题，发布时间等等）后，下一步就是循环通知微信浏览器一个一个去打开这些文章网页。每个文章网页也注入js脚本，功能是不停的检查页面的点赞数和阅读数，检测到，就往某服务器发，后台每成功收到一个文章的点赞数和阅读数，就通知微信浏览器打开下一个url。这里我使用了socketio，实现微信浏览器和自建的koa服务器之间的通讯。

## 如何运行
第一步，一定要安装成功anyproxy，这一步请详细阅读anyproxy的官方教程，写的很详细，要保证能成功代理https，能查看到https的body内容。

```
npm install
node index
```
会自动打开一个result.html，实时查看爬取文章的内容
点击一个微信公众号，点击查看历史消息，之后历史页面会不停的滚动到底，滚动完毕，就开始一篇一篇打开文章，爬取内容。
