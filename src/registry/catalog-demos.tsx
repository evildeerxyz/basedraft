"use client";

/* Written by scripts/registry.mjs from src/registry/entries: each newer component's live demo and examples. Don't edit by hand. */
import type { ComponentType } from "react";
import { Demo as e_accordionDemo, examples as e_accordionExamples } from "./entries/accordion/demo";
import { Demo as e_actionBarDemo, examples as e_actionBarExamples } from "./entries/action-bar/demo";
import { Demo as e_aiChatDemo, examples as e_aiChatExamples } from "./entries/ai-chat/demo";
import { Demo as e_appSidebarDemo, examples as e_appSidebarExamples } from "./entries/app-sidebar/demo";
import { Demo as e_areaChartDemo, examples as e_areaChartExamples } from "./entries/area-chart/demo";
import { Demo as e_avatarDemo, examples as e_avatarExamples } from "./entries/avatar/demo";
import { Demo as e_badgeDemo, examples as e_badgeExamples } from "./entries/badge/demo";
import { Demo as e_barChartDemo, examples as e_barChartExamples } from "./entries/bar-chart/demo";
import { Demo as e_buttonDemo, examples as e_buttonExamples } from "./entries/button/demo";
import { Demo as e_cardDemo, examples as e_cardExamples } from "./entries/card/demo";
import { Demo as e_carouselDemo, examples as e_carouselExamples } from "./entries/carousel/demo";
import { Demo as e_checkboxDemo, examples as e_checkboxExamples } from "./entries/checkbox/demo";
import { Demo as e_codeInputDemo, examples as e_codeInputExamples } from "./entries/code-input/demo";
import { Demo as e_comboboxDemo, examples as e_comboboxExamples } from "./entries/combobox/demo";
import { Demo as e_commandDemo, examples as e_commandExamples } from "./entries/command/demo";
import { Demo as e_commandLineDemo, examples as e_commandLineExamples } from "./entries/command-line/demo";
import { Demo as e_copyButtonDemo, examples as e_copyButtonExamples } from "./entries/copy-button/demo";
import { Demo as e_dataTableDemo, examples as e_dataTableExamples } from "./entries/data-table/demo";
import { Demo as e_datePickerDemo, examples as e_datePickerExamples } from "./entries/date-picker/demo";
import { Demo as e_dialogDemo, examples as e_dialogExamples } from "./entries/dialog/demo";
import { Demo as e_donutChartDemo, examples as e_donutChartExamples } from "./entries/donut-chart/demo";
import { Demo as e_emptyStateDemo, examples as e_emptyStateExamples } from "./entries/empty-state/demo";
import { Demo as e_fieldDemo, examples as e_fieldExamples } from "./entries/field/demo";
import { Demo as e_fileDropDemo, examples as e_fileDropExamples } from "./entries/file-drop/demo";
import { Demo as e_holdButtonDemo, examples as e_holdButtonExamples } from "./entries/hold-button/demo";
import { Demo as e_hoverCardDemo, examples as e_hoverCardExamples } from "./entries/hover-card/demo";
import { Demo as e_inboxDemo, examples as e_inboxExamples } from "./entries/inbox/demo";
import { Demo as e_inlineEditDemo, examples as e_inlineEditExamples } from "./entries/inline-edit/demo";
import { Demo as e_inputDemo, examples as e_inputExamples } from "./entries/input/demo";
import { Demo as e_kanbanBoardDemo, examples as e_kanbanBoardExamples } from "./entries/kanban-board/demo";
import { Demo as e_kbdDemo, examples as e_kbdExamples } from "./entries/kbd/demo";
import { Demo as e_marqueeDemo, examples as e_marqueeExamples } from "./entries/marquee/demo";
import { Demo as e_menuDemo, examples as e_menuExamples } from "./entries/menu/demo";
import { Demo as e_meterDemo, examples as e_meterExamples } from "./entries/meter/demo";
import { Demo as e_numberDemo, examples as e_numberExamples } from "./entries/number/demo";
import { Demo as e_numberFieldDemo, examples as e_numberFieldExamples } from "./entries/number-field/demo";
import { Demo as e_onboardingDemo, examples as e_onboardingExamples } from "./entries/onboarding/demo";
import { Demo as e_popoverDemo, examples as e_popoverExamples } from "./entries/popover/demo";
import { Demo as e_pricingTableDemo, examples as e_pricingTableExamples } from "./entries/pricing-table/demo";
import { Demo as e_radioGroupDemo, examples as e_radioGroupExamples } from "./entries/radio-group/demo";
import { Demo as e_resizableDemo, examples as e_resizableExamples } from "./entries/resizable/demo";
import { Demo as e_segmentedDemo, examples as e_segmentedExamples } from "./entries/segmented/demo";
import { Demo as e_selectDemo, examples as e_selectExamples } from "./entries/select/demo";
import { Demo as e_sheetDemo, examples as e_sheetExamples } from "./entries/sheet/demo";
import { Demo as e_skeletonDemo, examples as e_skeletonExamples } from "./entries/skeleton/demo";
import { Demo as e_sliderDemo, examples as e_sliderExamples } from "./entries/slider/demo";
import { Demo as e_sortableListDemo, examples as e_sortableListExamples } from "./entries/sortable-list/demo";
import { Demo as e_spinnerDemo, examples as e_spinnerExamples } from "./entries/spinner/demo";
import { Demo as e_statDemo, examples as e_statExamples } from "./entries/stat/demo";
import { Demo as e_stepperDemo, examples as e_stepperExamples } from "./entries/stepper/demo";
import { Demo as e_switchDemo, examples as e_switchExamples } from "./entries/switch/demo";
import { Demo as e_tabsDemo, examples as e_tabsExamples } from "./entries/tabs/demo";
import { Demo as e_tagInputDemo, examples as e_tagInputExamples } from "./entries/tag-input/demo";
import { Demo as e_textareaDemo, examples as e_textareaExamples } from "./entries/textarea/demo";
import { Demo as e_themeToggleDemo, examples as e_themeToggleExamples } from "./entries/theme-toggle/demo";
import { Demo as e_toastDemo, examples as e_toastExamples } from "./entries/toast/demo";
import { Demo as e_toolbarDemo, examples as e_toolbarExamples } from "./entries/toolbar/demo";
import { Demo as e_tooltipDemo, examples as e_tooltipExamples } from "./entries/tooltip/demo";
import { Demo as e_wizardDemo, examples as e_wizardExamples } from "./entries/wizard/demo";

export const ENTRY_DEMOS: Record<string, ComponentType> = {
  "accordion": e_accordionDemo,
  "action-bar": e_actionBarDemo,
  "ai-chat": e_aiChatDemo,
  "app-sidebar": e_appSidebarDemo,
  "area-chart": e_areaChartDemo,
  "avatar": e_avatarDemo,
  "badge": e_badgeDemo,
  "bar-chart": e_barChartDemo,
  "button": e_buttonDemo,
  "card": e_cardDemo,
  "carousel": e_carouselDemo,
  "checkbox": e_checkboxDemo,
  "code-input": e_codeInputDemo,
  "combobox": e_comboboxDemo,
  "command": e_commandDemo,
  "command-line": e_commandLineDemo,
  "copy-button": e_copyButtonDemo,
  "data-table": e_dataTableDemo,
  "date-picker": e_datePickerDemo,
  "dialog": e_dialogDemo,
  "donut-chart": e_donutChartDemo,
  "empty-state": e_emptyStateDemo,
  "field": e_fieldDemo,
  "file-drop": e_fileDropDemo,
  "hold-button": e_holdButtonDemo,
  "hover-card": e_hoverCardDemo,
  "inbox": e_inboxDemo,
  "inline-edit": e_inlineEditDemo,
  "input": e_inputDemo,
  "kanban-board": e_kanbanBoardDemo,
  "kbd": e_kbdDemo,
  "marquee": e_marqueeDemo,
  "menu": e_menuDemo,
  "meter": e_meterDemo,
  "number": e_numberDemo,
  "number-field": e_numberFieldDemo,
  "onboarding": e_onboardingDemo,
  "popover": e_popoverDemo,
  "pricing-table": e_pricingTableDemo,
  "radio-group": e_radioGroupDemo,
  "resizable": e_resizableDemo,
  "segmented": e_segmentedDemo,
  "select": e_selectDemo,
  "sheet": e_sheetDemo,
  "skeleton": e_skeletonDemo,
  "slider": e_sliderDemo,
  "sortable-list": e_sortableListDemo,
  "spinner": e_spinnerDemo,
  "stat": e_statDemo,
  "stepper": e_stepperDemo,
  "switch": e_switchDemo,
  "tabs": e_tabsDemo,
  "tag-input": e_tagInputDemo,
  "textarea": e_textareaDemo,
  "theme-toggle": e_themeToggleDemo,
  "toast": e_toastDemo,
  "toolbar": e_toolbarDemo,
  "tooltip": e_tooltipDemo,
  "wizard": e_wizardDemo,
};

export const ENTRY_EXAMPLES: Record<string, Record<string, ComponentType>> = {
  "accordion": e_accordionExamples,
  "action-bar": e_actionBarExamples,
  "ai-chat": e_aiChatExamples,
  "app-sidebar": e_appSidebarExamples,
  "area-chart": e_areaChartExamples,
  "avatar": e_avatarExamples,
  "badge": e_badgeExamples,
  "bar-chart": e_barChartExamples,
  "button": e_buttonExamples,
  "card": e_cardExamples,
  "carousel": e_carouselExamples,
  "checkbox": e_checkboxExamples,
  "code-input": e_codeInputExamples,
  "combobox": e_comboboxExamples,
  "command": e_commandExamples,
  "command-line": e_commandLineExamples,
  "copy-button": e_copyButtonExamples,
  "data-table": e_dataTableExamples,
  "date-picker": e_datePickerExamples,
  "dialog": e_dialogExamples,
  "donut-chart": e_donutChartExamples,
  "empty-state": e_emptyStateExamples,
  "field": e_fieldExamples,
  "file-drop": e_fileDropExamples,
  "hold-button": e_holdButtonExamples,
  "hover-card": e_hoverCardExamples,
  "inbox": e_inboxExamples,
  "inline-edit": e_inlineEditExamples,
  "input": e_inputExamples,
  "kanban-board": e_kanbanBoardExamples,
  "kbd": e_kbdExamples,
  "marquee": e_marqueeExamples,
  "menu": e_menuExamples,
  "meter": e_meterExamples,
  "number": e_numberExamples,
  "number-field": e_numberFieldExamples,
  "onboarding": e_onboardingExamples,
  "popover": e_popoverExamples,
  "pricing-table": e_pricingTableExamples,
  "radio-group": e_radioGroupExamples,
  "resizable": e_resizableExamples,
  "segmented": e_segmentedExamples,
  "select": e_selectExamples,
  "sheet": e_sheetExamples,
  "skeleton": e_skeletonExamples,
  "slider": e_sliderExamples,
  "sortable-list": e_sortableListExamples,
  "spinner": e_spinnerExamples,
  "stat": e_statExamples,
  "stepper": e_stepperExamples,
  "switch": e_switchExamples,
  "tabs": e_tabsExamples,
  "tag-input": e_tagInputExamples,
  "textarea": e_textareaExamples,
  "theme-toggle": e_themeToggleExamples,
  "toast": e_toastExamples,
  "toolbar": e_toolbarExamples,
  "tooltip": e_tooltipExamples,
  "wizard": e_wizardExamples,
};
