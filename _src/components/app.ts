/*
 * App component.
 */
export default {
    component: {
        app: {
            css: {
                width: 'var(--zoom-width)',
                height: 'var(--zoom-height)',
                scale: 'var(--zoom-scale)',
                'nn-main div.down': { transform: 'scale(0.95)' }
            },
            children: ['background', 'main', 'foreground'],
        }
    }
} as Extension;
