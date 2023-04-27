export const app: SF = function ({owner}, {link}) {
    const app = link('app');
    app.owner = owner;
    app.page = 'splash';
    setTimeout(() => {
        app.page = 'room'
    }, 3999)
}