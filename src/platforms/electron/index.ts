import Client from '../../client/client';

const client = new Client();
client.registerFS();
client.createFactory('home'); // from here: create a worker that loads home.js
// client.createGame('2v2');
console.log('app started');