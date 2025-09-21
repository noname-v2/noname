/*
 * App component.
 */
const ext: Extension = ({ ui, Component }) => ({
    App: class extends Component {
        static css = {
            width: 'var(--zoom-width)',
            height: 'var(--zoom-height)',
            scale: 'var(--zoom-scale)',
        };
        render() {
            this.append(
                ui.background(),
                ui.main({left: 20, top: 20, width: 200, height: 200, style: {
                    backgroundColor: '#a0a0a0', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,1)'}
                }),
                ui.foreground()
                // from here: implement map<rendering, state> for components
            );
        }
    }
});

export default ext;