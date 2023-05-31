export const App: FC = ({ page, $page }, { Arena, Room, Splash, Zoom, Foreground, Background, reply, refresh }) => {
    const main = (p: string, fade: 'in' | 'out') => {
        if (p === 'arena') return <Arena fade={fade} />;
        if (p === 'room') return <Room fade={fade} />;
        if (p === 'splash') return <Splash fade={fade} />;
        return '';
    }

    if ($page) {
        refresh();
    }

    return <nn-app onClick={() => {
        if (page === 'splash') reply('room');
        else if (page === 'room') reply('arena');
        else if (page === 'arena') reply('splash')
        else alert('error');
    }}>
        <Zoom cid='app-zoom'>
            <Foreground cid='app-fg' />
            {main(page, 'in')}
            {main($page, 'out')}
            <Background cid='app-bg'/>
        </Zoom>
    </nn-app>
};