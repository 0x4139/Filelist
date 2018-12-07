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
Filelist.loginAsync().then(()=>{
	Filelist.searchAsync('query', 'pageNr', 'cat', 'searchin', 'sort').then(torrents=>{
		//do whatever with torrents
	});
});

Filelist.downloadTorrent('torrentHref',[optional]torrentFileName).then(function(path){
	//do whatever with the path
});
```

##TODO
category api
cleanup

## License

MIT