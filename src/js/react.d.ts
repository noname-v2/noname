import * as React from 'react';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'nn-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-arena': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-background': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-foreground': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-room': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-splash': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
            'nn-zoom': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        }
    }
}