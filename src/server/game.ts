import stages from '../stages/game/index';
import components from '../components/game/index';
import entities from '../entities/game/index';
import importExtension from './extension';

stages.forEach(ext => importExtension(ext));
components.forEach(ext => importExtension(ext));
entities.forEach(ext => importExtension(ext));