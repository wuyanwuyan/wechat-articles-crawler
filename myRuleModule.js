const Koa = require('Koa');
const koaBody = require('koa-body');
const Router = require('koa-router');
const fs = require('fs');
const ip = require('ip').address();
const app = new Koa();
const moment = require('moment');
var server = require('http').createServer(app.callback());
var io = require('socket.io')(server);

const router = new Router();

// error handle
app.use(async function (ctx, next) {
    try {
        await next();
    } catch (e) {
        console.log('error', e, ctx);
        app.emit('error', e, ctx);
    }
});

app.use(require('koa2-cors')());
app.use(koaBody({multipart: true}));

var articles = [];

let index = 0;
router.get('/', async (ctx, next) => {
    ctx.body = fs.readFileSync('./result.html', 'utf-8');
})


app.use(router.routes());

server.listen(9000);
require("openurl").open("http://localhost:9000");

let wechatIo = io.of('/wechatwebpage'), resultIo = io.of('/result');
wechatIo.on('connection', function (socket) {
    socket.on('crawler', (crawData) => {
        crawData.crawTime = moment().format('YYYY-MM-DD HH:mm');

        let newData = Object.assign({
            otitle: articles[index].title,
            ourl: articles[index].content_url,
            author: articles[index].author
        }, crawData);

        socket.emit('success');

        resultIo.emit('newData', newData);

        index++;
        if (articles[index]) {
            socket.emit('url', {url: articles[index].content_url, index: index, total: articles.length});
        } else {
            socket.emit('end', {});
        }
    });


    socket.on('noData', (crawData) => {
        console.log(' 超时没有爬取到？ url: ', articles[index].content_url);

        index++;
        if (articles[index]) {
            socket.emit('url', {url: articles[index].content_url, index: index,total: articles.length});
        } else {
            socket.emit('end', {});
        }
    });

});


function injectJquery(body) {
    return body.replace(/<\/head>/g, '<script src="https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js"></script><script src="https://cdn.bootcss.com/socket.io/2.0.4/socket.io.js"></script></head>')
}

var injectJsFile = fs.readFileSync('./injectJs.js', 'utf-8').replace('{$IP}', ip);
var articleInjectJsFile = fs.readFileSync('./articleInjectJs.js', 'utf-8').replace('{$IP}', ip);
var injectJs = `<script id="injectJs" type="text/javascript">${injectJsFile}</script>`;
var articleInjectJs = `<script id="injectJs" type="text/javascript">${articleInjectJsFile}</script>`;
let stopScroll = false;

module.exports = {
    summary: 'wechat articles',
    *beforeSendRequest(requestDetail) {
        console.log('------ requestDetail   ', requestDetail.url, ' ----------- ', requestDetail.requestOptions);
    },
    *beforeSendResponse(requestDetail, responseDetail) {
        // 历史文章列表
        if (requestDetail.url.indexOf('mp.weixin.qq.com/mp/profile_ext?') !== -1 && requestDetail.requestOptions.method === 'GET') {
            console.log('get  profile_ext', responseDetail.response.header['Content-Type']);

            const newResponse = responseDetail.response;
            let body = responseDetail.response.body.toString();
            let newAdd = [];

            let can_msg_continue = true;

            if (responseDetail.response.header['Content-Type'].indexOf('text/html') !== -1) {

                let msgReg = /var msgList = \'(.*?)\';/;

                let execBody = msgReg.exec(body)[1];
                let msgList = JSON.parse(execBody.replace(/&quot;/g, '"'));//JSON.parse(msgReg.exec(body)[1]);

                msgList.list.forEach((v, i) => {
                    if (v.app_msg_ext_info) {
                        v.app_msg_ext_info.del_flag != 4 && newAdd.push(
                            Object.assign({}, v.app_msg_ext_info, v.comm_msg_info)
                        )
                        let subList = (v.app_msg_ext_info && v.app_msg_ext_info.multi_app_msg_item_list) || [];
                        subList.forEach(v1 => {
                            v1.del_flag != 4 && newAdd.push(
                                Object.assign({}, v1, v.comm_msg_info)
                            )
                        })
                    }
                })

                newResponse.body = injectJquery(body).replace(/<\/body>/g, injectJs + '</body>');

                let header = Object.assign({}, responseDetail.response.header);
                // 删除微信的安全策略，禁止缓存
                delete header['Content-Security-Policy'];
                delete header['Content-Security-Policy-Report-Only'];
                header['Expires'] = 0;
                header['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                newResponse.header = header;

            } else {

                if (stopScroll) {
                    return;
                }

                can_msg_continue = body.indexOf('can_msg_continue":1') !== -1;

                let regList = /general_msg_list":"(.*)","next_offset/;

                let list = regList.exec(body)[1];

                let reg = /\\"/g;

                let general_msg_list = JSON.parse(list.replace(reg, '"'));

                general_msg_list.list.forEach((v, i) => {
                    if (v.app_msg_ext_info) {
                        v.app_msg_ext_info.del_flag != 4 && newAdd.push(
                            Object.assign({}, v.app_msg_ext_info, v.comm_msg_info)
                        )
                        let subList = (v.app_msg_ext_info && v.app_msg_ext_info.multi_app_msg_item_list) || [];
                        subList.forEach(v1 => {
                            v1.del_flag != 4 && newAdd.push(
                                Object.assign({}, v1, v.comm_msg_info)
                            )
                        })
                    }
                });

            }

            newAdd.forEach(v => {
                v.content_url = v.content_url.replace(/amp;/g, '').replace(/\\\//g, '/').replace('#wechat_redirect', '');
            })

            const maxLength = 1000;

            if (articles.length < maxLength)
                articles = articles.concat(newAdd);

            console.log('--- articles length ', articles.length);

            if (!can_msg_continue || articles.length >= maxLength) {
                stopScroll = true;
                fetchListEnd_StartArticle();
            }


            return {response: newResponse};


        } else if (requestDetail.url.indexOf('mp.weixin.qq.com/mp/getappmsgext?') !== -1 && requestDetail.requestOptions.method == 'POST') {   // 获取评论数，点赞数

        } else if (requestDetail.url.indexOf('mp.weixin.qq.com/s?') !== -1 && requestDetail.requestOptions.method == 'GET') {  // 文章内容
            const newResponse = responseDetail.response;
            let body = responseDetail.response.body.toString();

            newResponse.body = injectJquery(body).replace(/\s<\/body>\s/g, articleInjectJs + '</body>');

            let header = Object.assign({}, responseDetail.response.header);
            // 删除微信的安全策略，禁止缓存
            delete header['Content-Security-Policy'];
            delete header['Content-Security-Policy-Report-Only'];
            header['Expires'] = 0;
            header['Cache-Control'] = 'no-cache, no-store, must-revalidate';
            newResponse.header = header;

            return {response: newResponse};
        }

    },
    *beforeDealHttpsRequest(requestDetail) {
        return true;
    },
};

function fetchListEnd_StartArticle() {
    console.log('最终获取文章的列表总数： ', articles.length);
    wechatIo.emit('url', {url: articles[0].content_url, index: 0, total: articles.length});
}