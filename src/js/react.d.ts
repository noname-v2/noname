import * as React from 'react';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'nn-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-arena': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-background': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-foreground': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-room': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-splash': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
            'nn-zoom': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string }, HTMLElement>;
        }
    }
}