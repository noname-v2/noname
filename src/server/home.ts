import stages from '../stages/home/index';
import components from '../components/home/index';
import entities from '../entities/home/index';
import importExtension from './extension';

stages.forEach(ext => importExtension(ext));
components.forEach(ext => importExtension(ext));
entities.forEach(ext => importExtension(ext));