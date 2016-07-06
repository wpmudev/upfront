(function ($) {

	define([
		"chosen",
		"scripts/upfront/global-event-handlers",
		"scripts/upfront/inline-panels/inline-panels",
		"scripts/upfront/element-settings/sidebar",
		"scripts/upfront/link-panel", // If adding more arguments adjust _.rest in line 72
		"upfront/post-editor/upfront-post-edit",
		"scripts/upfront/upfront-views-editor/jquery-plugins",
		"scripts/upfront/upfront-views-editor/mixins",
		"scripts/upfront/upfront-views-editor/fields",
		"scripts/upfront/upfront-views-editor/fonts",
		"scripts/upfront/upfront-views-editor/theme-colors",
		"scripts/upfront/upfront-views-editor/modal",
		"scripts/upfront/upfront-views-editor/modal-bg-setting",
		"scripts/upfront/upfront-views-editor/settings",
		"scripts/upfront/upfront-views-editor/css",
		"scripts/upfront/upfront-views-editor/breakpoint",
		"scripts/upfront/upfront-views-editor/region",
		"scripts/upfront/upfront-views-editor/commands",
		"scripts/upfront/upfront-views-editor/topbar",
		"scripts/upfront/upfront-views-editor/notifier",
		"scripts/upfront/upfront-views-editor/loading",
		"scripts/upfront/upfront-views-editor/post-selector",
		"scripts/upfront/upfront-views-editor/sidebar",
		"scripts/upfront/upfront-views-editor/presets/button/collection",
		"scripts/upfront/upfront-views-editor/property",
		"scripts/upfront/upfront-views-editor/properties",
		"text!upfront/templates/property.html",
		"text!upfront/templates/properties.html",
		"text!upfront/templates/property_edit.html",
		"text!upfront/templates/overlay_grid.html",
		"text!upfront/templates/edit_background_area.html",
		"text!upfront/templates/sidebar_settings_lock_area.html",
		"text!upfront/templates/sidebar_settings_background.html",
		"text!upfront/templates/popup.html",
		"text!upfront/templates/region_add_panel.html",
		"text!upfront/templates/region_edit_panel.html",
		"text!upfront/templates/sidebar_settings_theme_colors.html",
		"text!upfront/templates/color_picker.html",
		'spectrum'
	], function (
			chosen,
			globalEventHandlers,
			InlinePanelsLoader,
			ElementSettingsSidebar,
			LinkPanel,
			PostEditorBox,
			__jquery_plugins,
			Mixins,
			Fields,
			Fonts,
			Theme_Colors,
			Modal,
			ModalBgSetting,
			Settings,
			CSS,
			BreakPoint,
			Region,
			Commands,
			Topbar,
			notifier,
			Loading,
			PostSelector,
			Sidebar,
			button_presets_collection,
			Property,
			Properties
	) {
		var _template_files = [
			"text!upfront/templates/property.html",
			"text!upfront/templates/properties.html",
			"text!upfront/templates/property_edit.html",
			"text!upfront/templates/overlay_grid.html",
			"text!upfront/templates/edit_background_area.html",
			"text!upfront/templates/sidebar_settings_lock_area.html",
			"text!upfront/templates/sidebar_settings_background.html",
			"text!upfront/templates/popup.html",
			"text!upfront/templates/region_add_panel.html",
			"text!upfront/templates/region_edit_panel.html",
			"text!upfront/templates/sidebar_settings_theme_colors.html",
			"text!upfront/templates/color_picker.html"
		];

		// Auto-assign the template contents to internal variable
		var _template_args = _.rest(arguments, 26),
			_Upfront_Templates = {}
			;
		_(_template_files).each(function (file, idx) {
			if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
		});

		var InlinePanels = InlinePanelsLoader;




		Upfront.Events.on('data:ready', function(){
			Upfront.data.tpls = _Upfront_Templates;
		});

		return {
			"Editor": {
				"Property": Property,
				"Properties": Properties,
				"Commands": Commands.Commands,
				"Command": Commands.Command,
				"Command_SaveLayout": Commands.Command_SaveLayout,
				"Command_SavePostLayout": Commands.Command_SavePostLayout,
				"Command_CancelPostLayout": Commands.Command_CancelPostLayout,
				"Command_Undo": Commands.Command_Undo,
				"Command_ToggleGrid": Commands.Command_ToggleGrid,
				"Command_Merge": Commands.Command_Merge,
				"Settings": Settings,
				"Button": {
					"Presets": button_presets_collection
				},
				"Fonts": Fonts,
				"Field": Fields,
				"Sidebar": Sidebar,
				"Topbar": {
					"Topbar": Topbar
				},
				notify : function(message, type, duration){
					notifier.addMessage(message, type, duration);
				},
				"Loading": Loading,
				"Modal": Modal,
				"ModalBgSetting": ModalBgSetting,
				"PostSelector": new PostSelector(),
				InlinePanels: InlinePanels,
				"RegionPanels": Region.RegionPanels,
				"RegionPanelsAddRegion": Region.RegionPanelItemAddRegion,
				"RegionFixedPanels": Region.RegionFixedPanels,
				"RegionFixedEditPosition" : Region.RegionFixedEditPosition,
				"CSSEditor": CSS.CSSEditor,
				"Insert_Font_Widget": Fonts.Insert_Font_Widget,
				"GeneralCSSEditor": CSS.GeneralCSSEditor,
				"LinkPanel": LinkPanel
			},
			Mixins: Mixins,
			Theme_Colors : Theme_Colors,
			breakpoints_storage: BreakPoint.storage,
			Font_Model: Fonts.Model
		};
	});
})(jQuery);

//# sourceURL=upfront-views-editor.js
