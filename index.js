const { request } = require('https'),
  { parse, URLSearchParams } = require('url'),
  { createReadStream, createWriteStream } = require('fs');

module.exports = class Selectel {
  constructor(USER, PASSWORD) {
    if (!USER) throw new Error('SET USER');
    if (!PASSWORD) throw new Error('SET PASSWORD');

    this.USER = USER;
    this.PASSWORD = PASSWORD;
    this.AUTH_STATUS = false;
    this.X_AUTH_TOKEN = false;
    this.X_EXPIRE_AUTH_TOKEN = false;
    this.X_STORAGE_URL = false;
    this.X_STORAGE_URL_HOST = false;
    this.X_STORAGE_URL_PATH = false;
  }

  infoStorage() {
    return this._request({
      method: 'HEAD'
    });
  }

  listContainers(options = {}) {
    let query = new URLSearchParams({ format: 'json' });
    if (options.format) query.set('format', options.format);
    if (options.limit) query.set('limit', options.limit);
    if (options.marker) query.set('marker', options.marker);
    return this._request({
      path: '?' + query.toString()
    });
  }

  createContainer(container_name, options = {}) {
    return this._request({
      method: 'PUT',
      path: escape(container_name),
      headers: options.headers || {}
    });
  }

  infoContainer(container_name) {
    return this._request({
      method: 'HEAD',
      path: escape(container_name)
    });
  }

  editMeta(container_name, options = {}) {
    return this._request({
      method: 'POST',
      path: escape(container_name),
      headers: options.headers || {}
    });
  }

  deleteContainer(container_name) {
    return this._request({
      method: 'DELETE',
      path: escape(container_name)
    });
  }

  listFiles(container_name, options = {}) {
    let query = new URLSearchParams({ format: 'json' });
    if (options.format) query.set('format', options.format);
    if (options.limit) query.set('limit', options.limit);
    if (options.marker) query.set('marker', options.marker);
    if (options.prefix) query.set('prefix', options.prefix);
    if (options.path) query.set('path', options.path);
    if (options.delimiter) query.set('delimiter', options.delimiter);
    return this._request({
      path: '?' + query.toString()
    });
  }

  downloadFile(remote_path_to_file, local_path_to_file) {
    return this._request({
      download: true,
      path: escape(remote_path_to_file),
      local_file: local_path_to_file
    });
  }

  uploadFile(local_path_to_file_or_buffer, remote_path_to_file, options = {}) {
    return this._request({
      upload: true,
      method: 'PUT',
      headers: options.headers || {},
      path: escape(remote_path_to_file) + (options.arhive || ''),
      local_file: local_path_to_file_or_buffer
    });
  }

  uploadArhUnpack(local_path_to_file_or_buffer, remote_path, arhive_format, options = {}) {
    options.arhive = '?extract-archive=' + arhive_format;
    return this.uploadFile(local_path_to_file_or_buffer, remote_path, options);
  }

  uploadArhUnpack2(local_path_to_file_or_buffer, remote_path, arhive_format, options = {}) {
    options.arhive = '?extract-archive-v2=' + arhive_format;
    return this.uploadFile(local_path_to_file_or_buffer, remote_path, options);
  }

  arhUnpack2Status(extract_id) {
    return this._request({
      host: 'api.selcdn.ru',
      path: 'v1/extract-archive/' + extract_id
    });
  }

  _auth() {
    return new Promise((resolve, reject) => {
      if (this.AUTH_STATUS
        && this.X_AUTH_TOKEN
        && this.X_STORAGE_URL
        && this.X_STORAGE_URL_HOST
        && this.X_STORAGE_URL_PATH
        && Date.now() < this.X_EXPIRE_AUTH_TOKEN) {
        return resolve(this);
      }
      if (!this.USER || !this.PASSWORD) {
        return reject(new Error('USER AND PASSWORD ...'));
      }
      request({
        host: 'api.selcdn.ru',
        path: '/auth/v1.0',
        headers: {
          'X-Auth-User': this.USER,
          'X-Auth-Key': this.PASSWORD
        }
      }, (response) => {
        if (response.statusCode === 204
          && response.headers['x-auth-token']
          && response.headers['x-expire-auth-token']
          && response.headers['x-storage-url']) {


          this.AUTH_STATUS = true;
          this.X_AUTH_TOKEN = response.headers['x-auth-token'];
          this.X_EXPIRE_AUTH_TOKEN = Date.now() + (parseInt(response.headers['x-expire-auth-token']) * 1000);
          this.X_STORAGE_URL = response.headers['x-storage-url'];
          let storage_url = parse(response.headers['x-storage-url']);

          this.X_STORAGE_URL_HOST = storage_url.host;
          this.X_STORAGE_URL_PATH = storage_url.path;

          resolve(this);

        } else {
          reject(new Error(`ERROR AUTH`));
        }
      }).on('error', (errorRequest) => {
        reject(errorRequest);
      }).end();
    });

  }

  _request(requestOptions) {

    return new Promise((resolve, reject) => {
      this._auth().then((auth) => {
        let options = {
          host: requestOptions.host || this.X_STORAGE_URL_HOST,
          method: requestOptions.method || 'GET',
          headers: Object.assign((requestOptions.headers || {}), {
            'X-Auth-Token': this.X_AUTH_TOKEN
          }),
          path: this.X_STORAGE_URL_PATH + '/' + (requestOptions.path || ''),
        };
        let req = request(options, (response) => {
          let resolveData = {
            body: '',
            headers: response.headers,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage
          };
          if (!requestOptions.download) {
            response.on('data', (chunk) => {
              resolveData.body += chunk;
            });
          } else {
            response.pipe(createWriteStream(requestOptions.local_file));
          }
          response.on('end', () => {
            resolve(resolveData);
          });

        });
        req.on('error', (errorRequest) => {
          reject(errorRequest);
        });
        if (!requestOptions.upload) {
          req.end();
        } else {
          createReadStream(requestOptions.local_file).pipe(req);
        }

      }).catch((errorAuth) => {
        reject(errorAuth);
      });
    });
  }
}