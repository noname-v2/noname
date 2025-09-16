/*
 * App component.
 */
const ext: Extension = ({ ui, components }) => ({
    App: class extends components.Component {
        render() {
            this.append(ui.zoom(
                ui.background(),
                ui.main(),
                ui.foreground()
                // from here: automatically add hook for stage change
                // by capturing which stage properties are accessed during render()
            ));
        }
    }
});

export default ext;