import { defineComponents } from "../client/ui";

defineComponents(ui => [
    /**
     * Background component.
     */
    class Background extends ui.Component {
        render() {
            return ui.div({style: {position: 'absolute', width: '100%', height: '100%', backgroundColor: 'black'}});
        }
    },

    /**
     * App component.
     */
    class App extends ui.Component {
        render() {
            ui.zoom(
                ui.background(),
                this.main(),
                ui.foreground()
            );
        }

        main() {
            return ui[this.state('page') ?? 'home'] ?? null;
        }
    }
], 0);
