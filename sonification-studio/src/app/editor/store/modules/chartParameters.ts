/*
    Data store for global chart parameters.
 */

import { GenericObject, firstDefined } from '../../core/utils/objects';

const defaultState = () => ({
    type: 'areaspline',
    legendEnabled: true,
    inverted: false,
    title: 'Test chart',
    subtitle: '',
    xAxisTitle: '',
    xAxisType: 'linear',
    xAxisVisible: true,
    xAxisMin: '',
    xAxisMax: '',
    yAxisTitle: 'Values',
    yAxisType: 'linear',
    yAxisVisible: true,
    yAxisMin: '',
    yAxisMax: '',
    seriesLabelsEnabled: false,
    sharedTooltipEnabled: true,
    zoomType: 'x',
    dataGroupingType: 'default'
});

export const chartParametersStore = {
    namespaced: true,

    state: defaultState(),

    mutations: {
        // Apply a new state or restore to default if no new state is supplied.
        restoreStoreState(state: any, newState?: GenericObject) {
            if (newState) {
                Object.keys(defaultState()).forEach(
                    key => state[key] = firstDefined(newState[key], state[key]));
            } else {
                Object.assign(state, defaultState());
            }
        },

        setType(state: any, type: string) {
            state.type = type;
        },

        setLegendEnabled(state: any, enabled: boolean) {
            state.legendEnabled = enabled;
        },

        setChartInverted(state: any, inverted: boolean) {
            state.inverted = inverted;
        },

        setSharedTooltipEnabled(state: any, enabled: boolean) {
            state.sharedTooltipEnabled = enabled;
        },

        setTitle(state: any, title: string) {
            state.title = title;
        },

        setSubtitle(state: any, subtitle: string) {
            state.subtitle = subtitle;
        },

        setXAxisTitle(state: any, title: string) {
            state.xAxisTitle = title;
        },

        setXAxisType(state: any, type: string) {
            state.xAxisType = type;
        },

        setXAxisVisible(state: any, visible: boolean) {
            state.xAxisVisible = visible;
        },

        setXAxisMin(state: any, value: string) {
            state.xAxisMin = value;
        },

        setXAxisMax(state: any, value: string) {
            state.xAxisMax = value;
        },

        setYAxisTitle(state: any, title: string) {
            state.yAxisTitle = title;
        },

        setYAxisType(state: any, type: string) {
            state.yAxisType = type;
        },

        setYAxisVisible(state: any, visible: boolean) {
            state.yAxisVisible = visible;
        },

        setYAxisMin(state: any, value: string) {
            state.yAxisMin = value;
        },

        setYAxisMax(state: any, value: string) {
            state.yAxisMax = value;
        },

        setSeriesLabelsEnabled(state: any, enabled: boolean) {
            state.seriesLabelsEnabled = enabled;
        },

        setZoomType(state: any, type: string) {
            state.zoomType = type;
        },

        setDataGroupingType(state: any, type: string) {
            state.dataGroupingType = type;
        }
    }
};
