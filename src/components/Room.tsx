export default {
    Room: (_, {animate, ref}) => {
        animate({
            in: {scale: 1.2}, out: {translate: 100}, jump: [{translate: [0, 50]}, {}]
        });
    
        return <nn-room ref={ref()}><h1>Room {_.animate}</h1></nn-room>
    }
} as FCM;