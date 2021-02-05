const Koa = require("koa")
    , Router = require('koa-router')
    , koaBody = require("koa-body")
    , log4js = require('log4js')
    , path = require("path")
    , root = process.env["rootPath"]
    , fs = require("fs").promises
    , SendFile = require('koa-sendfile')
    , WEB_PORT = 3333
    ;
const logger = log4js.getLogger("静态文件服务器")
    , webApp = new Koa()
    , router = new Router()
    ;
logger.level = "TRACE";
async function IsDirectory(p) {
    try {
        let stat = await fs.lstat(p);
        let isDirectory = stat.isDirectory();
        return isDirectory;
    }
    catch (e) {
        logger.error("访问失败", e);
    }
}
webApp.use(async function (ctx) {
    let filePath = decodeURIComponent(ctx.request.path);
    logger.info(`${ctx.method} ${filePath}`);
    let reuqestPath = path.join(root, filePath);
    let isDirectory = await IsDirectory(reuqestPath);
    //logger.info(isDirectory);
    if (isDirectory) {
        let files = await fs.readdir(reuqestPath);
        let ul = ['<ul>'];
        for (let i = 0; i < files.length; i++) {
            ul.push(`<li><a href="${path.join(filePath, files[i])}">${files[i]}</a>`)
        }
        ul.push("</ul>");
        let html = ['<html>', '<head>', '<title>文件服务器</title>', '</head>', '<body>',`<div>共有文件（目录） ${files.length} 个。</div>`].concat(ul);
        html.push('</body>');
        html.push('</html>');
        ctx.response.type = "html";
        ctx.body = html.join('\r\n');
    }
    else {
        let stats = await SendFile(ctx, reuqestPath);
        if (!ctx.status) {
            ctx.throw(404);
        }
        else {
            ctx.response.set('Content-type', "application/force-download");
            //ct.setHeader('Content-type', mimetype);
        }
    }

});
//webApp.use(router.routes()).use(router.allowedMethods());
webApp.listen(WEB_PORT, function (err) {
    if (err) {
        logger.error('开启端口失败', err);
        process.exit(1);
    }
    else {
        logger.info('WEB服务启动成功 0.0.0.0:' + WEB_PORT);
        logger.info(`根路径为: ${root}`);
    }
});