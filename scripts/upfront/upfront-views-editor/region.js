(function(){

    define([
        "scripts/upfront/upfront-views-editor/region/region-panels",
        "scripts/upfront/upfront-views-editor/region/region-panel-add",
        "scripts/upfront/upfront-views-editor/region/region-panel-item",
        "scripts/upfront/upfront-views-editor/region/region-panel-item-add-region",
        "scripts/upfront/upfront-views-editor/region/region-panel-item-bg-setting",
        "scripts/upfront/upfront-views-editor/region/region-panel-item-expand-lock",
        "scripts/upfront/upfront-views-editor/region/region-fixed-edit-position",
        "scripts/upfront/upfront-views-editor/region/region-fixed-panels",
        "scripts/upfront/upfront-views-editor/region/region-bg-setting",
        "scripts/upfront/upfront-views-editor/region/region-bg-setting-fixed",
        "scripts/upfront/upfront-views-editor/region/region-bg-setting-lightbox"
    ], function (
        RegionPanels,
        RegionPanelAdd,
        RegionPanelItem,
        RegionPanelItemAddRegion,
        RegionPanelItemBgSetting,
        RegionPanelItemExpandLock,
        RegionFixedEditPosition,
        RegionFixedPanels,
        RegionBgSetting,
        RegionBgSettingFixed,
        RegionBgSettingLightbox
    ) {

        return {
            RegionPanels: RegionPanels,
            RegionPanelAdd: RegionPanelAdd,
            RegionPanelItem: RegionPanelItem,
            RegionPanelItemAddRegion: RegionPanelItemAddRegion,
            RegionPanelItemBgSetting: RegionPanelItemBgSetting,
            RegionPanelItemExpandLock: RegionPanelItemExpandLock,
            RegionFixedEditPosition: RegionFixedEditPosition,
            RegionFixedPanels: RegionFixedPanels,
            RegionBgSetting: RegionBgSetting,
            RegionBgSettingFixed: RegionBgSettingFixed,
            RegionBgSettingLightbox: RegionBgSettingLightbox
        };
    });

}());