export const Home: FC = (_, {animate}) => {
    return <nn-home ref={animate({fade: {'out': {scale: 0}}})}><h1>Home</h1></nn-home>
};