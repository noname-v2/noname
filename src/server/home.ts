import stages from '../build/stages_home';
import components from '../build/components_home';
import entities from '../build/entities_home';
import { ui, importExtension } from './extension';
import { render } from './component';

stages.forEach(ext => importExtension(ext));
components.forEach(ext => importExtension(ext));
entities.forEach(ext => importExtension(ext));

console.log('home worker started');
render(ui.app());