import stages from '../build/stages';
import components from '../build/components';
import entities from '../build/entities';
import { ui, importExtension } from './extension';
import { attachRoot } from './component';

export default class Server {
   start() {
       // Start the server
       stages.forEach(ext => importExtension(ext));
        components.forEach(ext => importExtension(ext));
        entities.forEach(ext => importExtension(ext));

        console.log('server started');
        attachRoot(ui.app());
   }
}