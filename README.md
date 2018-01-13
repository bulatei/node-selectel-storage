# selectel-storage
Пакет создан для личного пользования.
Буду рад если кому-то пригодится.

Подробнее документация находится по адресу [База знаний Selectel | API облачного хранилища](https://kb.selectel.ru/22058988.html)

## Установка
Установка с помощью npm:

    npm install --save selectel-storage


## Начало

```js
const Selectel = require('selectel-storage');
const selClient = new Selectel('Username', 'Password');
```

## Методы 

Все методы возвращают Promise, 
например получение информации об аккаунте: 
```js
selClient.infoStorage().then((data) => {
	
}).catch((error) => {

});
```
data - это объект: 
```js
{
  body: 'тут тело ответа api selectel', // 
  headers: {},
  statusCode: 200,
  statusMessage: ''
}
```