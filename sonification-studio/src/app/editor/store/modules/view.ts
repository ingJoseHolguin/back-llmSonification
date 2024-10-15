/*
    Data store for data that is specific to the app view components, but
    used across multiple components.
*/

import Vue from 'vue';

interface SelectHeaderTabPayload {
    selectedTabId: string;
    contentId: string;
}

interface ExpandedAccordionItemPayload {
    itemName: string;
    expanded: boolean;
}

export const viewStore = {
    namespaced: true,

    state: {
        // Reactive dependencies, see ChartBridge.reactiveGet()
        reactToParameterUpdates: 0,
        reactToDataUpdates: 0,

        // Also reactive-related, used to force recreating the entire chart
        showChartComponent: true,

        // Normal view state parameters
        loadingChart: false,
        selectedHeaderTabContent: 'chartContent',
        selectedHeaderTabId: 'Chart',
        selectedSidebarTabId: 'Visual',
        sidebarVisible: true,
        showGridTools: false,
        playbackProgress: 0,
        selectedDataSeriesChartMapping: '',
        selectedDataSeriesAudioMapping: '',
        expandedGlobalAudioBasicAccordionItem: true,
        expandedGlobalAudioDefaultsAccordionItem: false,
        expandedGlobalAudioContextsAccordionItem: false,
        expandedSeriesAudioAccordionItems: {
            Instrument: true
        },
        expandedChartMappingsAccordionItems: {
            Basic: true
        }
    },

    mutations: {
        selectHeaderTab(state: any, payload: SelectHeaderTabPayload) {
            state.selectedHeaderTabId = payload.selectedTabId;
            state.selectedHeaderTabContent = payload.contentId;
        },

        selectSidebarTab(state: any, selectedTab: string) {
            state.selectedSidebarTabId = selectedTab;
        },

        setPlaybackProgress(state: any, progressPct: number) {
            state.playbackProgress = progressPct;
        },

        setSelectedDataSeriesChartMapping(state: any, seriesId: string) {
            state.selectedDataSeriesChartMapping = seriesId;
        },

        setSelectedDataSeriesAudioMapping(state: any, seriesId: string) {
            state.selectedDataSeriesAudioMapping = seriesId;
        },

        setSidebarVisible(state: any, visible: boolean) {
            state.sidebarVisible = visible;
        },

        setShowChartComponent(state: any, show: boolean) {
            state.showChartComponent = show;
        },

        setShowGridTools(state: any, show: boolean) {
            state.showGridTools = show;
        },

        setLoadingChart(state: any, loading: boolean) {
            state.loadingChart = loading;
        },

        setExpandedSeriesAudioAccordionItem(state: any, payload: ExpandedAccordionItemPayload) {
            Vue.set(state.expandedSeriesAudioAccordionItems, payload.itemName, payload.expanded);
        },

        setExpandedChartMappingsAccordionItem(state: any, payload: ExpandedAccordionItemPayload) {
            Vue.set(state.expandedChartMappingsAccordionItems, payload.itemName, payload.expanded);
        },

        setExpandedGlobalAudioBasicAccordionItem(state: any, selected: boolean) {
            state.expandedGlobalAudioBasicAccordionItem = selected;
        },

        setExpandedGlobalAudioDefaultsAccordionItem(state: any, selected: boolean) {
            state.expandedGlobalAudioDefaultsAccordionItem = selected;
        },

        setExpandedGlobalAudioContextsAccordionItem(state: any, selected: boolean) {
            state.expandedGlobalAudioContextsAccordionItem = selected;
        },

        triggerParameterReactivity(state: any) {
            state.reactToParameterUpdates++;
        },

        triggerDataReactivity(state: any) {
            state.reactToDataUpdates++;
        }
    }
};
