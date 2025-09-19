import stages from '../build/stages';
import components from '../build/components';
import entities from '../build/entities';
import logger from '../logger';
import { createApp } from './tree';
import { api, importExtension } from './extension';

export default class Server {
   clients = new Set<string>();

   // Start the server
   start() {
      stages.forEach(ext => importExtension(ext));
      components.forEach(ext => importExtension(ext));
      entities.forEach(ext => importExtension(ext));

      logger.log('Server started');
      this.createClient('self');
      createApp(api, this);
   }

   // Send data to a client
   send(id: string, data: any) {
      if (!this.clients.has(id)) {
         return;
      }
      self.postMessage(data);
   }

   // Send data to all clients
   broadcast(data: any) {
      self.postMessage(data);
   }

   // Add a new client connection
   createClient(id: string) {
      this.clients.add(id);
   }
}