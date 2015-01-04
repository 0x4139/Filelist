var promise = require('promise');
var cheerio = require('cheerio');
var request = require('request');
var crypto = require('crypto');
var FileCookieStore = require("tough-cookie-filestore");
var fs = require('fs');

console = require('winston');
request = request.defaults({
    jar: request.jar(new FileCookieStore("cookies.json")),
    gzip: true,
    headers: {
        "Connection": "keep-alive",
        "Cache-Control": "max-age=0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Origin": "http://flro.org",
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36",
        "Accept-Encoding": "gzip, deflate",
        "Accept-Language": "en-US,en;q=0.8,ro;q=0.6"
    }
});

function Filelist(user, password) {
    this.user = user;
    this.password = password;
    this.login();
}
Filelist.prototype.login = function() {
    request.post({
        url: "http://flro.org/takelogin.php",
        headers: {
            "Referer": "http://flro.org/login.php"
        },
        form: {
            username: this.user,
            password: this.password
        }
    }, function(err, response, body) {
        if (body === "") {
            console.info('Filelist:', "Logged in");
        } else {
            console.error('Filelist:', "Not logged in");
        }
    });
};
Filelist.prototype._checkLogin = function() {
    return new promise(function(resolve, reject) {
        request("http://flro.org/my.php", function(err, response, body) {
            if ("/login.php" == response.request.uri.path) {
                console.error('Filelist:', 'Please login first!');
                reject();
            } else {
                resolve();
            }
        });
    });
};
Filelist.prototype.search = function(query) {
    return new promise(function(resolve, reject) {
        request({
            url: "http://flro.org/browse.php",
            headers: {
                "Referer": "http://flro.org/browse.php"
            },
            qs: {
                search: query,
                cat: 0,
                searchin: 0,
                sort: 0
            }
        }, function(err, response, body) {
            if (err) reject(err);
            var $ = cheerio.load(body);
            torrents = [];
            $(".torrentrow").each(function(key, item) {
                var cat = $(".torrenttable:nth-child(1) img", item).attr("alt");
                var title = $(".torrenttable:nth-child(2) a", item).attr("title");
                var date = $(".torrenttable:nth-child(6) .small", item).html().split("<br>")[1];
                var size = $(".torrenttable:nth-child(7)", item).text();
                var seed = $(".torrenttable:nth-child(9)", item).text();
                var peer = $(".torrenttable:nth-child(10)", item).text();
                var path = $(".torrenttable:nth-child(3) a", item).attr("href");
                torrents.push({
                    title: title,
                    url: "http://flro.org/" + path,
                    date:date,
                    size:size,
                    seeds:seed,
                    leechers:peer,
                    path:path
                });
            });
            resolve(torrents);
        });
    });
};
Filelist.prototype._genHash=function(){
	var current_date = (new Date()).valueOf().toString();
	var random = Math.random().toString();
	var path ='./tmp/'+crypto.createHash('sha1').update(current_date + random).digest('hex')+'.torrent';
	return path;
};
Filelist.prototype.downloadTorrent=function(torrentHref){
	var that=this;
	return new promise(function(resolve,reject){
		var path=that._genHash();
		request(torrentHref).pipe(fs.createWriteStream(path));
		resolve(path);
	});
};
module.exports=Filelist;