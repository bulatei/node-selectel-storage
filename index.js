var request = require('request'),
	async = require('async'),
	fs = require('fs');

var Conf = {
	login:null,
	pass:null
},
selAuthData = {
	x_expire_auth_token:null,
	x_storage_url:null,
	x_auth_token:null,
	is_authorized:false
},
copyHeaders = function(req, headers) {
	for (var fieldName in headers) {
		req.headers[fieldName] = headers[fieldName];
	}
},
selAuth = function(callback){
	request({
		url: 'https://auth.selcdn.ru/',
		headers: {
			'X-Auth-User': Conf.login,
			'X-Auth-Key': Conf.pass
		}
	},
	function(err, data) {
		if (err) {
			callback(true, err);
		} else {
			if (data.statusCode == 204) {
				selAuthData.x_expire_auth_token=((parseInt(data.headers['x-expire-auth-token'])*1000) + Date.now());
				selAuthData.x_storage_url=data.headers['x-storage-url'];
				selAuthData.x_auth_token=data.headers['x-auth-token'];
				selAuthData.is_authorized=true;
				callback(false,selAuthData);
			} else {
				callback(true,data.body);
			}
		}
	});
},
upload_file = function (fullLocalPath, hostingPath, callback, additionalHeaders) {
	async.waterfall([
		function(wfCb) {
			fs.readFile(fullLocalPath, wfCb);
		},
		function(file, wfCb) {
			var req = {
				url: selAuthData.x_storage_url + hostingPath,
				method: 'PUT',
				headers: {
					'X-Auth-Token': selAuthData.x_auth_token,
					'Content-Length': fs.statSync(fullLocalPath).size
				},
				body: file
			};
			copyHeaders(req, additionalHeaders);
			request(req, wfCb);
		}
	],
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 201) {
				callback(null, {success: true});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},
delete_file = function(filePath, callback) {
	request({
		url: selAuthData.x_storage_url + filePath,
		method: 'DELETE',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 204) {
				callback(null, {success: true});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
};

exports.setConf = function(login, pass) {
	Conf.login = login;
	Conf.pass = pass;
	return Conf;
};

exports.uploadFile = function(fullLocalPath, hostingPath, callback, additionalHeaders) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		upload_file(fullLocalPath, hostingPath, callback, additionalHeaders);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				upload_file(fullLocalPath, hostingPath, callback, additionalHeaders);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.deleteFile = function(filePath, callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		delete_file(filePath, callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				delete_file(filePath, callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

