import { db } from "../client/db";

let currentUpdate: (diff: Dict) => void;

window.addEventListener('resize', () => {
    currentUpdate({ width: window.innerWidth, height: window.innerHeight})
});


export const Zoom: FC = ({width, height, children, ax, ay}, {update}) => {
    currentUpdate = update;

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

    return <nn-zoom style={{'--zoom-width': w + 'px', '--zoom-height': h + 'px', '--zoom-scale': z}}>{children}</nn-zoom>
};