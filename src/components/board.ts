export default {
    component: {
        board: {
            render(ui) {
                return [
                    ui.div({
                        left: 20, top: 20, width: 200, height: 200, style: {
                            backgroundColor: '#a0a0a0', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,1)'
                        },
                        slot: 0,
                        onClick: 'log',
                        down: true,
                    }, 'abc', 'def')
                ];
            },
            mixin: ['layer']
        }
    }
} as Extension;
