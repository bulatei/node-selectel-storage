const Selectel = require('./index');
const selClient = new Selectel('Username','j');
selClient.infoStorage().then((data) => {
    console.log(data);
}).catch((error) => {
    console.error(error);
});