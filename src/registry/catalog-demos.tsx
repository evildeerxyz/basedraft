"use client";

/* Written by scripts/registry.mjs from src/registry/entries: each newer component's live demo and examples. Don't edit by hand. */
import type { ComponentType } from "react";
import { Demo as e_accordionDemo, examples as e_accordionExamples } from "./entries/accordion/demo";
import { Demo as e_accountMenuDemo, examples as e_accountMenuExamples } from "./entries/account-menu/demo";
import { Demo as e_actionBarDemo, examples as e_actionBarExamples } from "./entries/action-bar/demo";
import { Demo as e_aiChatDemo, examples as e_aiChatExamples } from "./entries/ai-chat/demo";
import { Demo as e_alertDemo, examples as e_alertExamples } from "./entries/alert/demo";
import { Demo as e_allowanceDemo, examples as e_allowanceExamples } from "./entries/allowance/demo";
import { Demo as e_appSidebarDemo, examples as e_appSidebarExamples } from "./entries/app-sidebar/demo";
import { Demo as e_areaChartDemo, examples as e_areaChartExamples } from "./entries/area-chart/demo";
import { Demo as e_avatarDemo, examples as e_avatarExamples } from "./entries/avatar/demo";
import { Demo as e_badgeDemo, examples as e_badgeExamples } from "./entries/badge/demo";
import { Demo as e_bannerDemo, examples as e_bannerExamples } from "./entries/banner/demo";
import { Demo as e_barChartDemo, examples as e_barChartExamples } from "./entries/bar-chart/demo";
import { Demo as e_barListDemo, examples as e_barListExamples } from "./entries/bar-list/demo";
import { Demo as e_breadcrumbDemo, examples as e_breadcrumbExamples } from "./entries/breadcrumb/demo";
import { Demo as e_buttonDemo, examples as e_buttonExamples } from "./entries/button/demo";
import { Demo as e_cardDemo, examples as e_cardExamples } from "./entries/card/demo";
import { Demo as e_carouselDemo, examples as e_carouselExamples } from "./entries/carousel/demo";
import { Demo as e_checkboxDemo, examples as e_checkboxExamples } from "./entries/checkbox/demo";
import { Demo as e_chipsDemo, examples as e_chipsExamples } from "./entries/chips/demo";
import { Demo as e_codeBlockDemo, examples as e_codeBlockExamples } from "./entries/code-block/demo";
import { Demo as e_codeDiffDemo, examples as e_codeDiffExamples } from "./entries/code-diff/demo";
import { Demo as e_codeInputDemo, examples as e_codeInputExamples } from "./entries/code-input/demo";
import { Demo as e_colorPickerDemo, examples as e_colorPickerExamples } from "./entries/color-picker/demo";
import { Demo as e_comboboxDemo, examples as e_comboboxExamples } from "./entries/combobox/demo";
import { Demo as e_commandDemo, examples as e_commandExamples } from "./entries/command/demo";
import { Demo as e_commandLineDemo, examples as e_commandLineExamples } from "./entries/command-line/demo";
import { Demo as e_commitDemo, examples as e_commitExamples } from "./entries/commit/demo";
import { Demo as e_compareSliderDemo, examples as e_compareSliderExamples } from "./entries/compare-slider/demo";
import { Demo as e_consentDemo, examples as e_consentExamples } from "./entries/consent/demo";
import { Demo as e_contextMenuDemo, examples as e_contextMenuExamples } from "./entries/context-menu/demo";
import { Demo as e_copyButtonDemo, examples as e_copyButtonExamples } from "./entries/copy-button/demo";
import { Demo as e_countdownDemo, examples as e_countdownExamples } from "./entries/countdown/demo";
import { Demo as e_dataTableDemo, examples as e_dataTableExamples } from "./entries/data-table/demo";
import { Demo as e_datePickerDemo, examples as e_datePickerExamples } from "./entries/date-picker/demo";
import { Demo as e_dialogDemo, examples as e_dialogExamples } from "./entries/dialog/demo";
import { Demo as e_ditherImageDemo, examples as e_ditherImageExamples } from "./entries/dither-image/demo";
import { Demo as e_dockDemo, examples as e_dockExamples } from "./entries/dock/demo";
import { Demo as e_donutChartDemo, examples as e_donutChartExamples } from "./entries/donut-chart/demo";
import { Demo as e_emptyStateDemo, examples as e_emptyStateExamples } from "./entries/empty-state/demo";
import { Demo as e_fieldDemo, examples as e_fieldExamples } from "./entries/field/demo";
import { Demo as e_fileDropDemo, examples as e_fileDropExamples } from "./entries/file-drop/demo";
import { Demo as e_filterBarDemo, examples as e_filterBarExamples } from "./entries/filter-bar/demo";
import { Demo as e_flowDemo, examples as e_flowExamples } from "./entries/flow/demo";
import { Demo as e_funnelDemo, examples as e_funnelExamples } from "./entries/funnel/demo";
import { Demo as e_gaugeDemo, examples as e_gaugeExamples } from "./entries/gauge/demo";
import { Demo as e_globeDemo, examples as e_globeExamples } from "./entries/globe/demo";
import { Demo as e_heatmapDemo, examples as e_heatmapExamples } from "./entries/heatmap/demo";
import { Demo as e_holdButtonDemo, examples as e_holdButtonExamples } from "./entries/hold-button/demo";
import { Demo as e_hoverCardDemo, examples as e_hoverCardExamples } from "./entries/hover-card/demo";
import { Demo as e_inboxDemo, examples as e_inboxExamples } from "./entries/inbox/demo";
import { Demo as e_inlineEditDemo, examples as e_inlineEditExamples } from "./entries/inline-edit/demo";
import { Demo as e_inputDemo, examples as e_inputExamples } from "./entries/input/demo";
import { Demo as e_kanbanBoardDemo, examples as e_kanbanBoardExamples } from "./entries/kanban-board/demo";
import { Demo as e_kbdDemo, examples as e_kbdExamples } from "./entries/kbd/demo";
import { Demo as e_lightboxDemo, examples as e_lightboxExamples } from "./entries/lightbox/demo";
import { Demo as e_liveCursorsDemo, examples as e_liveCursorsExamples } from "./entries/live-cursors/demo";
import { Demo as e_logViewerDemo, examples as e_logViewerExamples } from "./entries/log-viewer/demo";
import { Demo as e_marqueeDemo, examples as e_marqueeExamples } from "./entries/marquee/demo";
import { Demo as e_menuDemo, examples as e_menuExamples } from "./entries/menu/demo";
import { Demo as e_meterDemo, examples as e_meterExamples } from "./entries/meter/demo";
import { Demo as e_metricTabsDemo, examples as e_metricTabsExamples } from "./entries/metric-tabs/demo";
import { Demo as e_navigationMenuDemo, examples as e_navigationMenuExamples } from "./entries/navigation-menu/demo";
import { Demo as e_numberDemo, examples as e_numberExamples } from "./entries/number/demo";
import { Demo as e_numberFieldDemo, examples as e_numberFieldExamples } from "./entries/number-field/demo";
import { Demo as e_onboardingDemo, examples as e_onboardingExamples } from "./entries/onboarding/demo";
import { Demo as e_paginationDemo, examples as e_paginationExamples } from "./entries/pagination/demo";
import { Demo as e_particleTextDemo, examples as e_particleTextExamples } from "./entries/particle-text/demo";
import { Demo as e_passwordFieldDemo, examples as e_passwordFieldExamples } from "./entries/password-field/demo";
import { Demo as e_pipelineDemo, examples as e_pipelineExamples } from "./entries/pipeline/demo";
import { Demo as e_popoverDemo, examples as e_popoverExamples } from "./entries/popover/demo";
import { Demo as e_pricingTableDemo, examples as e_pricingTableExamples } from "./entries/pricing-table/demo";
import { Demo as e_radioGroupDemo, examples as e_radioGroupExamples } from "./entries/radio-group/demo";
import { Demo as e_resizableDemo, examples as e_resizableExamples } from "./entries/resizable/demo";
import { Demo as e_roadmapDemo, examples as e_roadmapExamples } from "./entries/roadmap/demo";
import { Demo as e_schedulerDemo, examples as e_schedulerExamples } from "./entries/scheduler/demo";
import { Demo as e_scrollAreaDemo, examples as e_scrollAreaExamples } from "./entries/scroll-area/demo";
import { Demo as e_segmentedDemo, examples as e_segmentedExamples } from "./entries/segmented/demo";
import { Demo as e_selectDemo, examples as e_selectExamples } from "./entries/select/demo";
import { Demo as e_shareDemo, examples as e_shareExamples } from "./entries/share/demo";
import { Demo as e_sheetDemo, examples as e_sheetExamples } from "./entries/sheet/demo";
import { Demo as e_signInDemo, examples as e_signInExamples } from "./entries/sign-in/demo";
import { Demo as e_skeletonDemo, examples as e_skeletonExamples } from "./entries/skeleton/demo";
import { Demo as e_sliderDemo, examples as e_sliderExamples } from "./entries/slider/demo";
import { Demo as e_sortableListDemo, examples as e_sortableListExamples } from "./entries/sortable-list/demo";
import { Demo as e_sparklineDemo, examples as e_sparklineExamples } from "./entries/sparkline/demo";
import { Demo as e_spinnerDemo, examples as e_spinnerExamples } from "./entries/spinner/demo";
import { Demo as e_splitButtonDemo, examples as e_splitButtonExamples } from "./entries/split-button/demo";
import { Demo as e_splitFlapDemo, examples as e_splitFlapExamples } from "./entries/split-flap/demo";
import { Demo as e_statDemo, examples as e_statExamples } from "./entries/stat/demo";
import { Demo as e_stepperDemo, examples as e_stepperExamples } from "./entries/stepper/demo";
import { Demo as e_swipeDeckDemo, examples as e_swipeDeckExamples } from "./entries/swipe-deck/demo";
import { Demo as e_switchDemo, examples as e_switchExamples } from "./entries/switch/demo";
import { Demo as e_tableOfContentsDemo, examples as e_tableOfContentsExamples } from "./entries/table-of-contents/demo";
import { Demo as e_tabsDemo, examples as e_tabsExamples } from "./entries/tabs/demo";
import { Demo as e_tagInputDemo, examples as e_tagInputExamples } from "./entries/tag-input/demo";
import { Demo as e_textareaDemo, examples as e_textareaExamples } from "./entries/textarea/demo";
import { Demo as e_themeToggleDemo, examples as e_themeToggleExamples } from "./entries/theme-toggle/demo";
import { Demo as e_timePickerDemo, examples as e_timePickerExamples } from "./entries/time-picker/demo";
import { Demo as e_timelineDemo, examples as e_timelineExamples } from "./entries/timeline/demo";
import { Demo as e_toastDemo, examples as e_toastExamples } from "./entries/toast/demo";
import { Demo as e_toolbarDemo, examples as e_toolbarExamples } from "./entries/toolbar/demo";
import { Demo as e_tooltipDemo, examples as e_tooltipExamples } from "./entries/tooltip/demo";
import { Demo as e_tourDemo, examples as e_tourExamples } from "./entries/tour/demo";
import { Demo as e_treeDemo, examples as e_treeExamples } from "./entries/tree/demo";
import { Demo as e_uptimeDemo, examples as e_uptimeExamples } from "./entries/uptime/demo";
import { Demo as e_wizardDemo, examples as e_wizardExamples } from "./entries/wizard/demo";

export const ENTRY_DEMOS: Record<string, ComponentType> = {
  "accordion": e_accordionDemo,
  "account-menu": e_accountMenuDemo,
  "action-bar": e_actionBarDemo,
  "ai-chat": e_aiChatDemo,
  "alert": e_alertDemo,
  "allowance": e_allowanceDemo,
  "app-sidebar": e_appSidebarDemo,
  "area-chart": e_areaChartDemo,
  "avatar": e_avatarDemo,
  "badge": e_badgeDemo,
  "banner": e_bannerDemo,
  "bar-chart": e_barChartDemo,
  "bar-list": e_barListDemo,
  "breadcrumb": e_breadcrumbDemo,
  "button": e_buttonDemo,
  "card": e_cardDemo,
  "carousel": e_carouselDemo,
  "checkbox": e_checkboxDemo,
  "chips": e_chipsDemo,
  "code-block": e_codeBlockDemo,
  "code-diff": e_codeDiffDemo,
  "code-input": e_codeInputDemo,
  "color-picker": e_colorPickerDemo,
  "combobox": e_comboboxDemo,
  "command": e_commandDemo,
  "command-line": e_commandLineDemo,
  "commit": e_commitDemo,
  "compare-slider": e_compareSliderDemo,
  "consent": e_consentDemo,
  "context-menu": e_contextMenuDemo,
  "copy-button": e_copyButtonDemo,
  "countdown": e_countdownDemo,
  "data-table": e_dataTableDemo,
  "date-picker": e_datePickerDemo,
  "dialog": e_dialogDemo,
  "dither-image": e_ditherImageDemo,
  "dock": e_dockDemo,
  "donut-chart": e_donutChartDemo,
  "empty-state": e_emptyStateDemo,
  "field": e_fieldDemo,
  "file-drop": e_fileDropDemo,
  "filter-bar": e_filterBarDemo,
  "flow": e_flowDemo,
  "funnel": e_funnelDemo,
  "gauge": e_gaugeDemo,
  "globe": e_globeDemo,
  "heatmap": e_heatmapDemo,
  "hold-button": e_holdButtonDemo,
  "hover-card": e_hoverCardDemo,
  "inbox": e_inboxDemo,
  "inline-edit": e_inlineEditDemo,
  "input": e_inputDemo,
  "kanban-board": e_kanbanBoardDemo,
  "kbd": e_kbdDemo,
  "lightbox": e_lightboxDemo,
  "live-cursors": e_liveCursorsDemo,
  "log-viewer": e_logViewerDemo,
  "marquee": e_marqueeDemo,
  "menu": e_menuDemo,
  "meter": e_meterDemo,
  "metric-tabs": e_metricTabsDemo,
  "navigation-menu": e_navigationMenuDemo,
  "number": e_numberDemo,
  "number-field": e_numberFieldDemo,
  "onboarding": e_onboardingDemo,
  "pagination": e_paginationDemo,
  "particle-text": e_particleTextDemo,
  "password-field": e_passwordFieldDemo,
  "pipeline": e_pipelineDemo,
  "popover": e_popoverDemo,
  "pricing-table": e_pricingTableDemo,
  "radio-group": e_radioGroupDemo,
  "resizable": e_resizableDemo,
  "roadmap": e_roadmapDemo,
  "scheduler": e_schedulerDemo,
  "scroll-area": e_scrollAreaDemo,
  "segmented": e_segmentedDemo,
  "select": e_selectDemo,
  "share": e_shareDemo,
  "sheet": e_sheetDemo,
  "sign-in": e_signInDemo,
  "skeleton": e_skeletonDemo,
  "slider": e_sliderDemo,
  "sortable-list": e_sortableListDemo,
  "sparkline": e_sparklineDemo,
  "spinner": e_spinnerDemo,
  "split-button": e_splitButtonDemo,
  "split-flap": e_splitFlapDemo,
  "stat": e_statDemo,
  "stepper": e_stepperDemo,
  "swipe-deck": e_swipeDeckDemo,
  "switch": e_switchDemo,
  "table-of-contents": e_tableOfContentsDemo,
  "tabs": e_tabsDemo,
  "tag-input": e_tagInputDemo,
  "textarea": e_textareaDemo,
  "theme-toggle": e_themeToggleDemo,
  "time-picker": e_timePickerDemo,
  "timeline": e_timelineDemo,
  "toast": e_toastDemo,
  "toolbar": e_toolbarDemo,
  "tooltip": e_tooltipDemo,
  "tour": e_tourDemo,
  "tree": e_treeDemo,
  "uptime": e_uptimeDemo,
  "wizard": e_wizardDemo,
};

export const ENTRY_EXAMPLES: Record<string, Record<string, ComponentType>> = {
  "accordion": e_accordionExamples,
  "account-menu": e_accountMenuExamples,
  "action-bar": e_actionBarExamples,
  "ai-chat": e_aiChatExamples,
  "alert": e_alertExamples,
  "allowance": e_allowanceExamples,
  "app-sidebar": e_appSidebarExamples,
  "area-chart": e_areaChartExamples,
  "avatar": e_avatarExamples,
  "badge": e_badgeExamples,
  "banner": e_bannerExamples,
  "bar-chart": e_barChartExamples,
  "bar-list": e_barListExamples,
  "breadcrumb": e_breadcrumbExamples,
  "button": e_buttonExamples,
  "card": e_cardExamples,
  "carousel": e_carouselExamples,
  "checkbox": e_checkboxExamples,
  "chips": e_chipsExamples,
  "code-block": e_codeBlockExamples,
  "code-diff": e_codeDiffExamples,
  "code-input": e_codeInputExamples,
  "color-picker": e_colorPickerExamples,
  "combobox": e_comboboxExamples,
  "command": e_commandExamples,
  "command-line": e_commandLineExamples,
  "commit": e_commitExamples,
  "compare-slider": e_compareSliderExamples,
  "consent": e_consentExamples,
  "context-menu": e_contextMenuExamples,
  "copy-button": e_copyButtonExamples,
  "countdown": e_countdownExamples,
  "data-table": e_dataTableExamples,
  "date-picker": e_datePickerExamples,
  "dialog": e_dialogExamples,
  "dither-image": e_ditherImageExamples,
  "dock": e_dockExamples,
  "donut-chart": e_donutChartExamples,
  "empty-state": e_emptyStateExamples,
  "field": e_fieldExamples,
  "file-drop": e_fileDropExamples,
  "filter-bar": e_filterBarExamples,
  "flow": e_flowExamples,
  "funnel": e_funnelExamples,
  "gauge": e_gaugeExamples,
  "globe": e_globeExamples,
  "heatmap": e_heatmapExamples,
  "hold-button": e_holdButtonExamples,
  "hover-card": e_hoverCardExamples,
  "inbox": e_inboxExamples,
  "inline-edit": e_inlineEditExamples,
  "input": e_inputExamples,
  "kanban-board": e_kanbanBoardExamples,
  "kbd": e_kbdExamples,
  "lightbox": e_lightboxExamples,
  "live-cursors": e_liveCursorsExamples,
  "log-viewer": e_logViewerExamples,
  "marquee": e_marqueeExamples,
  "menu": e_menuExamples,
  "meter": e_meterExamples,
  "metric-tabs": e_metricTabsExamples,
  "navigation-menu": e_navigationMenuExamples,
  "number": e_numberExamples,
  "number-field": e_numberFieldExamples,
  "onboarding": e_onboardingExamples,
  "pagination": e_paginationExamples,
  "particle-text": e_particleTextExamples,
  "password-field": e_passwordFieldExamples,
  "pipeline": e_pipelineExamples,
  "popover": e_popoverExamples,
  "pricing-table": e_pricingTableExamples,
  "radio-group": e_radioGroupExamples,
  "resizable": e_resizableExamples,
  "roadmap": e_roadmapExamples,
  "scheduler": e_schedulerExamples,
  "scroll-area": e_scrollAreaExamples,
  "segmented": e_segmentedExamples,
  "select": e_selectExamples,
  "share": e_shareExamples,
  "sheet": e_sheetExamples,
  "sign-in": e_signInExamples,
  "skeleton": e_skeletonExamples,
  "slider": e_sliderExamples,
  "sortable-list": e_sortableListExamples,
  "sparkline": e_sparklineExamples,
  "spinner": e_spinnerExamples,
  "split-button": e_splitButtonExamples,
  "split-flap": e_splitFlapExamples,
  "stat": e_statExamples,
  "stepper": e_stepperExamples,
  "swipe-deck": e_swipeDeckExamples,
  "switch": e_switchExamples,
  "table-of-contents": e_tableOfContentsExamples,
  "tabs": e_tabsExamples,
  "tag-input": e_tagInputExamples,
  "textarea": e_textareaExamples,
  "theme-toggle": e_themeToggleExamples,
  "time-picker": e_timePickerExamples,
  "timeline": e_timelineExamples,
  "toast": e_toastExamples,
  "toolbar": e_toolbarExamples,
  "tooltip": e_tooltipExamples,
  "tour": e_tourExamples,
  "tree": e_treeExamples,
  "uptime": e_uptimeExamples,
  "wizard": e_wizardExamples,
};
