(function ($) {

	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;

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
			property_tpl,
			properties_tpl,
			property_edit_tpl
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
		var _template_args = _.rest(arguments, 24),
			_Upfront_Templates = {}
			;
		_(_template_files).each(function (file, idx) {
			if (file.match(/text!/)) _Upfront_Templates[file.replace(/text!upfront\/templates\//, '').replace(/\.html/, '')] = _template_args[idx];
		});

		var InlinePanels = InlinePanelsLoader;




		Upfront.Events.on('data:ready', function(){
			Upfront.data.tpls = _Upfront_Templates;
		});



		// Stubbing interface control

		var Property = Backbone.View.extend({
			events: {
				"click .upfront-property-change": "show_edit_property_partial",
				"click .upfront-property-save": "save_property",
				"click .upfront-property-remove": "remove_property"
			},
			render: function () {
				var template = _.template(property_tpl, this.model.toJSON());
				this.$el.html(template);
			},

			remove_property: function () {
				this.model.destroy();
			},
			save_property: function () {
				var name = this.$("#upfront-new_property-name").val(),
					value = this.$("#upfront-new_property-value").val()
					;
				this.model.set({
					"name": name,
					"value": value
				});
				this.render();
			},
			show_edit_property_partial: function () {
				var template = _.template( property_edit_tpl, this.model.toJSON());
				this.$el.html(template);
			}
		});

		var Properties = Backbone.View.extend({
			events: {
				"click #add-property": "show_new_property_partial",
				"click #done-adding-property": "add_new_property"
			},
			initialize: function () {
				/*
				 this.model.get("properties").bind("change", this.render, this);
				 this.model.get("properties").bind("add", this.render, this);
				 this.model.get("properties").bind("remove", this.render, this);
				 */

				this.listenTo(this.model.get("properties"), 'change', this.render);
				this.listenTo(this.model.get("properties"), 'add', this.render);
				this.listenTo(this.model.get("properties"), 'remove', this.render);
			},
			render: function () {
				var template = _.template(properties_tpl, this.model.toJSON()),
					properties = this
					;
				this.$el.html(template);
				this.model.get("properties").each(function (obj) {
					var local_view = new Property({"model": obj});
					local_view.render();
					properties.$el.find("dl").append(local_view.el);
				});
			},

			show_new_property_partial: function () {
				this.$("#add-property").hide();
				this.$("#upfront-new_property").slideDown();
			},
			add_new_property: function () {
				var name = this.$("#upfront-new_property-name").val(),
					value = this.$("#upfront-new_property-value").val()
					;
				this.model.get("properties").add(new Upfront.Models.Property({
					"name": name,
					"value": value
				}));
				this.$("#upfront-new_property")
					.slideUp()
					.find("input").val('').end()
				;
				this.$("#add-property").show();
			}
		});


		/**
		 * DEPRECATED
		 */
		var ResponsiveCommand_BrowseLayout = Commands.Command.extend({
			className: "command-browse-layout command-browse-layout-responsive",
			render: function () {
				this.$el.html('<span title="'+ l10n.browse_layouts +'">' + l10n.browse_layouts + '</span>');
			},
			on_click: function () {
				Upfront.Events.trigger("command:layout:browse");
			}
		});



// ----- Done bringing things back








		//var button_presets_storage = new Button_Presets_Storage();







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
