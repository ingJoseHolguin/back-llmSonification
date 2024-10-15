declare module '*.vue' {
    import Vue from 'vue';
    export default Vue;
}
declare module '*.svg' {
    const value: string;
    export default value;
}
declare module '*.png' {
    const value: string;
    export default value;
}
declare module '*.min.js' {
    const value: any;
    export default value;
}
declare module 'highcharts/themes/high-contrast-light' {
    const value: Function;
    export default value;
}