import { defineComponent } from "../client/ui";

defineComponent('Background', ui =>
    /**
    * Background component.
    */
    class extends ui.Component {
        render() {
            return ui.div({ style: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'black' } });
        }
    }
);

defineComponent('App', ui =>
    /**
     * App component.
     */
    class extends ui.Component {
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
);
