import type { Platform } from '../src/client/platform';
import { main } from '../src/client/main';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';

class Capacitor implements Platform {
    async readFile() {
        console.log('capacitor')
        const contents = await Filesystem.readFile({
            path: 'text.txt',
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
        console.log('^^^', contents)
    }
}

main(new Capacitor());
