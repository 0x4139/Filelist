const cheerio = require('cheerio');
let request = require('request-promise');
const crypto = require('crypto');
const fs = require('fs');
const decompress = require('brotli/decompress');

console = require('winston');
request = request.defaults({
    jar: request.jar(),
    headers: {
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Origin": "https://filelist.ro",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "en-US,en;q=0.8,ro;q=0.6"
    },
    followAllRedirects: false,
    followRedirect: false,
    simple: false
});

function Filelist(user, password) {
    this.user = user;
    this.password = password;
    this.baseUrl = "https://filelist.ro/";
    this.textDecoder = new TextDecoder("utf-8");
}
Filelist.prototype.loginAsync = function () {
    return request.post({
        url: this.baseUrl + "takelogin.php",
        headers: {
            "Referer": this.baseUrl + "login.php"
        },
        form: {
            username: this.user,
            password: this.password
        },
        resolveWithFullResponse: true
    }).then(response => {
        if (response.body === "") {
            console.info('Filelist:', "Logged in");
        } else {
            console.error('Filelist:', "Not logged in");
        }
    })
};

Filelist.prototype.searchAsync = function (query, pageNr, cat, searchin, sort) {
    return request({
        url: this.baseUrl + "browse.php",
        headers: {
            "Referer": this.baseUrl + "browse.php"
        },
        qs: {
            search: query,
            cat: cat,
            searchin: searchin,
            sort: sort,
            page: pageNr
        },
        encoding: null,
        resolveWithFullResponse: true
    }).then((response) => {
        const decompressedBody = decompress(response.body);
        const decompressedBodyString = this.textDecoder.decode(decompressedBody);
        const $ = cheerio.load(decompressedBodyString);
        torrents = [];
        $(".torrentrow").each((key, item) => {
            const cat = $(".torrenttable:nth-child(1) img", item).attr("alt");
            const title = $(".torrenttable:nth-child(2) a", item).attr("title");
            const date = $(".torrenttable:nth-child(6) .small", item).html().split("<br>")[1];
            const size = $(".torrenttable:nth-child(7)", item).text();
            const seed = $(".torrenttable:nth-child(9)", item).text();
            const peer = $(".torrenttable:nth-child(10)", item).text();
            const path = $(".torrenttable:nth-child(3) a", item).attr("href");
            torrents.push({
                title: title,
                url: this.baseUrl + path,
                date: date,
                size: size,
                seeds: seed,
                leechers: peer,
                path: path
            });
        });
        return torrents;
    });
};
Filelist.prototype._genPath = function (fileName) {
    let path = './tmp/';
    if (fileName)
        return path + fileName + ".torrent";
    const current_date = (new Date()).valueOf().toString();
    const random = Math.random().toString();
    path += crypto.createHash('sha1').update(current_date + random).digest('hex') + '.torrent';
    return path;
};

Filelist.prototype.downloadTorrent = function (torrentHref, fileName) {
    const that = this;
    return new Promise(function (resolve, reject) {
        const path = that._genPath(fileName);
        const stream = fs.createWriteStream(path);
        stream.on('close', function () {
            resolve(path);
        });
        request(torrentHref).pipe(stream);
    });
};
module.exports = Filelist;