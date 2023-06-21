export default {
    Main: ({children}, {ref}) => {
        return <nn-main ref={ref()}>{children}</nn-main>
    }
} as FCM;