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
		if(fieldName === 'X-Container-Meta-Gallery-Secret'){
			req.headers[fieldName] = require('crypto').createHash('sha1').update(headers[fieldName]).digest('hex');
		}else{
			req.headers[fieldName] = headers[fieldName];
		}
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

info_storage = function(callback) {
	request({
		url: selAuthData.x_storage_url,
		method: 'HEAD',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 204) {
				callback(null, {
					success: true,
					data: data.headers
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

list_containers = function(data,callback){
	var urlData = '?format=' + data.format;
	if(data.limit){
		urlData += '&limit=' + data.limit;
	}
	if(data.marker){
		urlData += '&marker=' + data.marker;
	}
	request({
		url: selAuthData.x_storage_url + urlData,
		method: 'GET',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 200) {
				callback(null, {
					success: true,
					data: data.body
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

create_container = function(name_container,callback,additionalHeaders){
	var req = {
		url: selAuthData.x_storage_url + name_container,
		method: 'PUT',
		headers: {
			'X-Auth-Token': selAuthData.x_auth_token
		}
	};
	copyHeaders(req, additionalHeaders);
	request(req, function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 201) {
				callback(null, {
					success: true,
					data: "Created"
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

info_container = function(name_container,callback) {
	request({
		url: selAuthData.x_storage_url + name_container,
		method: 'HEAD',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 204) {
				callback(null, {
					success: true,
					data: data.headers
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

edit_meta = function(hostingPath,callback,additionalHeaders){
	var req = {
		url: selAuthData.x_storage_url + hostingPath,
		method: 'POST',
		headers: {
			'X-Auth-Token': selAuthData.x_auth_token
		}
	};
	copyHeaders(req, additionalHeaders);
	request(req, function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 204) {
				callback(null, {
					success: true,
					data: "ok"
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

delete_container = function(name_container,callback) {
	request({
		url: selAuthData.x_storage_url + name_container,
		method: 'DELETE',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 204) {
				callback(null, {
					success: true,
					data: "ok"
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

list_files = function(name_container, data, callback){
	var urlData = name_container + '?format=' + data.format;
	if(data.limit){
		urlData += '&limit=' + data.limit;
	}
	if(data.marker){
		urlData += '&marker=' + data.marker;
	}
	if(data.prefix){
		urlData += '&prefix=' + data.prefix;
	}
	if(data.path){
		urlData += '&path=' + data.path;
	}
	if(data.delimiter){
		urlData += '&delimiter=' + data.delimiter;
	}
	
	request({
		url: selAuthData.x_storage_url + urlData,
		method: 'GET',
		headers: {'X-Auth-Token': selAuthData.x_auth_token}
	},
	function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 200) {
				callback(null, {
					success: true,
					data: data.body
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
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
				callback(null, {
					success: true,
					data: 'ok'
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

upload_arh_unpack = function (fullLocalPath, hostingPath, arhFormat, callback, additionalHeaders) {
	async.waterfall([
		function(wfCb) {
			fs.readFile(fullLocalPath, wfCb);
		},
		function(file, wfCb) {
			var req = {
				url: selAuthData.x_storage_url + hostingPath + "?extract-archive=" + arhFormat,
				method: 'PUT',
				headers: {
					'X-Auth-Token': selAuthData.x_auth_token
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
			if (data.statusCode == 200) {
				callback(null, {
					success: true,
					data: data.body
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
},

copy_file = function(hostingPath,newPath,callback,additionalHeaders) {
	var req = {
		url: selAuthData.x_storage_url + hostingPath,
		method: 'COPY',
		headers: {
			'X-Auth-Token': selAuthData.x_auth_token,
			'Destination': newPath
		}
	};
	copyHeaders(req, additionalHeaders);
	request(req, function(err, data) {
		if (err || !data) {
			callback(err, {success: false});
		} else {
			if (data.statusCode == 201) {
				callback(null, {
					success: true,
					data: data.headers
				});
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
				callback(null, {
					success: true,
					data: 'ok'
				});
			} else {
				callback(null, {
					success: false,
					selectelMessage: data.body
				});
			}
		}
	});
};

//exports

exports.setConf = function(login, pass) {
	Conf.login = login;
	Conf.pass = pass;
	return Conf;
};

exports.infoStorage = function(callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		info_storage(callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				info_storage(callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.listContainers = function(data,callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		list_containers(data,callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				list_containers(data,callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.createContainer = function(name_container,callback,additionalHeaders) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		create_container(name_container,callback,additionalHeaders);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				create_container(name_container,callback,additionalHeaders);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.infoContainer = function(name_container,callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		info_container(name_container,callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				info_container(name_container,callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.editMeta = function(hostingPath,callback,additionalHeaders) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		edit_meta(hostingPath,callback,additionalHeaders);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				edit_meta(hostingPath,callback,additionalHeaders);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.deleteContainer = function(name_container,callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		delete_container(name_container,callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				delete_container(name_container,callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.listFiles = function(name_container, data, callback) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		list_files(name_container, data, callback);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				list_files(name_container, data, callback);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
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

exports.uploadArhUnpack = function(fullLocalPath, hostingPath, arhFormat, callback, additionalHeaders) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		upload_arh_unpack(fullLocalPath, hostingPath, arhFormat, callback, additionalHeaders);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				upload_arh_unpack(fullLocalPath, hostingPath, arhFormat, callback, additionalHeaders);
			}
		], function (err, results) {
			if(!err){
				callback(null, results[1]);
			}
		});
	}
};

exports.copyFile = function(hostingPath, newPath, callback, additionalHeaders) {
	if(selAuthData.is_authorized && (selAuthData.x_expire_auth_token > Date.now())){
		copy_file(hostingPath,newPath,callback,additionalHeaders);
	}else{
		async.series([
			function(callback){
				selAuth(callback);
			},
			function(callback){
				copy_file(hostingPath,newPath,callback,additionalHeaders);
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

