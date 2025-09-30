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
                'nn-main > div.down': { transform: 'scale(0.95)' }
            },
            render(ui) {
                this.append(
                    ui.background(),
                    ui.main(
                        ui.div({
                            left: 20, top: 20, width: 200, height: 200, style: {
                                backgroundColor: '#a0a0a0', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,1)'
                            },
                            slot: 0,
                            onClick: 'log',
                            down: true,
                        }, 'abc', 'def')
                    ),
                    ui.foreground()
                    // from here: implement map<rendering, state> for components
                );
            }
        }
    }
} as Extension;
