# Filelist.ro API
An api for search and download for the private tracker filelist.ro
```
npm install filelistro
```
it uses cookies.json to keep your cookies for future requests
## Usage

``` js
var Foo = require('filelistro');
var Filelist= new Foo('user','password');
Filelist.search('query').then(function(torrents){
	//do whatever with torrents
});

Filelist.downloadTorrent('torrentHref').then(function(path){
	//do whatever with the path
});
```

##TODO
category api
cleanup

## License

MIT