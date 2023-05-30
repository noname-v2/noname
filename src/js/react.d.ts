import * as React from 'react';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'nn-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-arena': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-background': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-foreground': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-room': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-splash': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
            'nn-zoom': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { class?: string, style?: {[key: string]: string | number} }, HTMLElement>;
        }
    }
}