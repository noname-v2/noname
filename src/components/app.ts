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
            render(ui) {
                // from here: manage append() with render()
                return [
                    ui.background(),
                    ui.main(
                        ui.board()
                    ),
                    ui.foreground()
                ];
            }
        }
    }
} as Extension;
