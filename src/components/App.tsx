export default {
    App: ({ page, $page }, { ui, refresh, reply, ref, bind }) => {
        const cmps = ui()
        const { Zoom, Foreground, Main, Background  } = cmps;
    
        // capatalize page ID to get corresponding component (e.g. home -> Home)
        const cap = (p: string) => p?.replace(/[a-z]/, c => c.toUpperCase()) as CapString;
        const Content = cmps[cap(page)];
        const OldContent = cmps[cap($page)];
    
        // delete old elements after fade out animation is done
        if ($page) {
            refresh();
        }
    
        // set click event
        bind(() => {
            if (page === 'home') reply('room');
            else if (page === 'room') reply('arena');
            else if (page === 'arena') reply('home')
        });
    
        return <nn-app ref={ref()}>
            <Zoom cid='zoom'>
                <Background cid='app-bg'/>
                <Main>
                    {page ? <Content cid={page} animate='in' /> : ''}
                    {$page ? <OldContent cid={$page} animate='out' /> : ''}
                </Main>
                <Foreground cid='app-fg' />
            </Zoom>
        </nn-app>
    },
    css: {
        $include: ['layer'],

        nnZoom: {
            $include: ['hollow'],

            position: 'absolute',
            left: 0,
            top: 0,
            transformOrigin: 'top left',
            width: 'var(--zoom-width)',
            height: 'var(--zoom-height)',
            scale: 'var(--zoom-scale)',
        }
    },
    mixin: {
        layer: {
            width: '100%',
            height: '100%',
            margin: 0,
            padding: 0,
            left: 0,
            top: 0,
            position: 'absolute',
            overflow: 'hidden'
        }
    }
} as FCM;