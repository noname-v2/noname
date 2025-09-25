export default {
    components: {
        layer: {
            css: {
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: '0',
                left: '0',
                overflow: 'hidden',
                margin: '0',
                padding: '0'
            }
        },
        background: {
            mixin: ['layer']
        },
        main: {
            mixin: ['layer']
        },
        foreground: {
            mixin: ['layer'],
            css: {
                pointerEvents: 'none' // make sure foreground does not block interactions
            }
        },
    }
} as Extension;
