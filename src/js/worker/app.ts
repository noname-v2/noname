export const app: SF = async function ({owner}, {link, ask}) {
    const app = link('app');
    app.owner = owner;
    app.page = 'splash';
    const page = await ask(owner);
    app.page = page
}