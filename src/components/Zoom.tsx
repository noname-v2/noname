import { db } from '../client/db';
import { setState } from '../client/state';

window.addEventListener('resize', () => {
    setState('zoom', { width: window.innerWidth, height: window.innerHeight})
});


export default {
    Zoom: ({width, height, children, ax, ay}) => {
        width = width || window.innerWidth;
        height = height || window.innerHeight;
        ax = ax || db?.get('window-width') || 960;
        ay = ay || db?.get('window-height') || 540;
        
        const zx = width / ax, zy = height / ay;
    
        let w, h, z;
    
        if (zx < zy) {
            w = ax;
            h = Math.ceil(ax / width * height);
            z = zx;
        }
        else {
            w = Math.ceil(ay / height * width);
            h = ay;
            z = zy;
        }
        
        // set global properties for other components to access
        setState('zoom-state', {width: w, height: h, zoom: z});
    
        return <nn-zoom style={{'--zoom-width': w + 'px', '--zoom-height': h + 'px', '--zoom-scale': z}}>{children}</nn-zoom>
    }
} as FCM;