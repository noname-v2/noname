/*
 * App component.
 */
const ext: Extension = ({ ui, components }) => ({
    App: class extends components.Component {
        render() {
            this.append(ui.zoom(
                ui.background(),
                ui.main({x: 20, width: 200, height: 200, style: {
                    backgroundColor: '#a0a0a0', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)'}
                },),
                ui.foreground()
                // from here: implement map<rendering, state> for components
            ));
        }
    }
});

export default ext;