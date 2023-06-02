export const App: FC = ({ page, $page }, { Arena, Room, Home, Zoom, Foreground, Main, Background, refresh, reply }) => {
    const main = (p: string, fade: 'in' | 'out') => {
        if (p === 'arena') return <Arena cid='arena' fade={fade} />;
        if (p === 'room') return <Room cid='room' fade={fade} />;
        if (p === 'home') return <Home cid='home' fade={fade} />;
        return '';
    }

    if ($page) {
        refresh();
    }

    return <nn-app onClick={() => {
        if (page === 'home') reply('room');
        else if (page === 'room') reply('home');
        // else if (page === 'arena') reply('home')
        // else alert('error');
    }}>
        <Zoom cid='app-zoom'>
            <Foreground cid='app-fg' />
            <Main>
                {main($page, 'out')}
                {main(page, 'in')}
            </Main>
            <Background cid='app-bg'/>
        </Zoom>
    </nn-app>
};