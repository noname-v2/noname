import stages from '../build/stages_game';
import components from '../build/components_game';
import entities from '../build/entities_game';
import importExtension from './extension';

stages.forEach(ext => importExtension(ext));
components.forEach(ext => importExtension(ext));
entities.forEach(ext => importExtension(ext));