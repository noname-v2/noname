/*
 * App component.
 */
const ext: Extension = ({ ui }) => ({
    App: class extends ui.Component {
        render() {
            ui.zoom(
                ui.background(),
                ui.main(this.children()),
                ui.foreground()
                // from here: automatically add hook for stage change
                // by capturing which stage properties are accessed during render()
            );
        }
    }
});

export default ext;