export default function({ui, defineComponent}: any) {
    defineComponent('Background');

    defineComponent(class App extends ui.Component {
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
    });

    defineComponent(class App extends ui.Component {
        render() {
            ui.gallery();
        }
    });
};
