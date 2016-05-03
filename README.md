# selectel-storage
Пакет создан на базе selectel-manager для личного пользования.
Буду рад если кому-то пригодится.

Подробнее документация находится по адресу [Selectel Storage API](https://support.selectel.ru/storage/api_info/)

## Установка
Установка с помощью npm:

    npm install --save selectel-storage


## Начало

```js
var selectel = require('selectel-storage');
selectel.setConf('login','password');
```

## Информация по хранилищу

```js
selectel.infoStorage(function(err, data){
    /* Если ошибок нет, то err == null, data.success == true
     * data.data тут заголовки ответа
     * например:
     * data.data['x-account-bytes-used'] - суммарный объём хранения данных в хранилище (в байтах)
     */
});
```

## Список контейнеров 

```js
selectel.listContainers({
    format: 'json' //json или xml
	//limit - число, ограничивает количество объектов в результате (по умолчанию 10000)
	//marker - строка, результат будет содержать объекты по значению больше указанного маркера (полезно использовать для постраничной навигации и при большом количестве контейнеров)
}, function (err , data) {
	//Если ошибок нет, то err == null, data.success == true
    //data.data - массив со списком контейнеров и с информацией о них.
});
```

## Создание контейнера

```js
selectel.createContainer('new_name_container', function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
    //data.data == Created.
}, {
	//Заголовки
	//пример:
	'X-Container-Meta-Type': 'public'
});
```

## Информация по контейнеру

```js
selectel.createContainer('name_container', function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
    //data.data['x-container-object-count'] - количество объектов в контейнере. и т.д.
});
```

## Изменение мета-данных контейнера или файла

контейнер:
```js
selectel.editMeta('name_container',function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data == ok 
}, , {
	//Заголовки
	//пример:
	'X-Container-Meta-***': '***'
});
```

файл:
```js
selectel.editMeta('name_container/name_file',function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data == ok 
}, , {
	//Заголовки
	//пример:
	'X-Object-Meta-***': '***'
});
```

## Удаление контейнера

```js
selectel.deleteContainer('name_container', function(err, data){
    // Если ошибок нет, то err == null, data.success == true
    // data.data == ok
});
```

## Список файлов в контейнере 

```js
selectel.deleteContainer('name_container', {
	format: 'json' //json или xml
	//limit - число, ограничивает количество объектов в результате (по умолчанию 10000)
	//marker - строка, результат будет содержать объекты по значению больше указанного маркера (полезно использовать для постраничной навигации и для большого количества файлов)
	//prefix - строка, вернуть объекты имена которых начинаются с указанного префикса
	//path - строка, вернуть объекты в указанной папке (виртуальные папки)
	//delimiter - символ, вернуть объекты до указанного разделителя в их имени
}, function(err, data){
    // Если ошибок нет, то err == null, data.success == true
    //data.data - массив со списком файлов и с информацией о них.
});
```

## Загрузка файла

```js
selectel.uploadFile('fullLocalPath', 'name_container/name_file',function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data == ok 
}, {
	//Заголовки
	//пример:
	'X-Delete-After': '86400' //через какое время удалить файл, указывается в секундах
});
```

## Распаковка архивов

```js
selectel.uploadArhUnpack('fullLocalPath', 'name_container/name_folder', 'arhive_format', function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data == {"Response Status": "201 Created", "Response Body": "", "Errors": [], "Number Files Created": 1237}
}, {
	//Заголовки
	//пример:
	'Accept': 'application/json' 
	//Поддерживается получение отчета в структурированном формате, для этого нужно при запросе указать заголовок Accept с одним из значений: text/plain, application/json, application/xml или text/xml.
});
```

## Копирование файлов в контейнерах 

```js
selectel.uploadFile('name_container/name_file', 'new_name_container/new_name_file', function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data - тут заголовки ответа
}, {
	//Заголовки
	//пример:
	'X-Object-Meta-***': '***'
});
```

## Удаление файла

```js
selectel.uploadFile('name_container/name_file',function (err, data) {
	//Если ошибок нет, то err == null, data.success == true
	//data.data == ok 
});
```
