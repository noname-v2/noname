export const app: SF = async function ({owner}, {link, ask}) {
    const app = link('app');
    app.owner = owner;
    app.page = 'splash';
    const page = await ask(owner);
    app.page = page
    const page2 = await ask(owner);
    app.page2 = page2;
    console.log(page, page2)
}