import { Theme } from "gosling.js";

// TODO: dark theme seems to be broken by undefined properties under `axis` and `legend`
/**
 * Deprecated: Custom themes that we use
 */
export const theme: Theme = {
    base: 'dark',
    root: {
        titleFontFamily: 'Roboto',
        subtitleFontFamily: 'Roboto',
        showMousePosition: false
    }, axis: {
        tickColor: 'white',
        labelColor: 'white',
        baselineColor: 'white',
        gridColor: 'gray',
        gridStrokeWidth: 1,
        labelFontSize: 12,
        labelFontWeight: 'bold',
        labelFontFamily: 'Roboto Condensed',
        gridStrokeType: 'solid',
        gridStrokeDash: [4, 4]
     }, legend: {
        background: 'black',
        backgroundOpacity: 0.7,
        labelColor: 'white',
        backgroundStroke: '#DBDBDB',
        tickColor: 'white',
        position: 'top',
        labelFontSize: 12,
        labelFontWeight: 'bold',
        labelFontFamily: 'Roboto Condensed'
     }
};