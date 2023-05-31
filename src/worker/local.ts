import { hub } from './hub';
import { uid } from '../utils';
import { createRoot } from './stage';
import { app } from './app';
import { lib } from './lib';
import { ready} from '../client/db';

ready.then(db => {
    if (!db.get('noname-uid')) {
        db.set('noname-uid', uid());
    }
    const me = db.get('noname-uid');
    self.onmessage = ({data}) => {
        hub.onmessage(me, data)
    }
    
    hub.init(me, (uid, msg) => {
        if (me === uid) {
            self.postMessage(msg);
        }
    });

    lib.register('#app', app);

    createRoot('#app', {owner: me});
});
