/*
 * App component.
 */
const ext: Extension = ({ ui, logger, Component }) => ({
    App: class extends Component {
        static css = {
            width: 'var(--zoom-width)',
            height: 'var(--zoom-height)',
            scale: 'var(--zoom-scale)',
        };
        render() {
            this.append(
                ui.background(),
                ui.main(
                    ui.div({
                        left: 20, top: 20, width: 200, height: 200, style: {
                            backgroundColor: '#a0a0a0', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,1)'
                        },
                        slot: 0,
                        onClick: 'log'
                    })
                ),
                ui.foreground()
                // from here: implement map<rendering, state> for components
            );
        }
        log() {
            logger.log('Clicked!');
        }
    }
});

export default ext;