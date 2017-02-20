(function($) {
	
var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/color-item',
	'scripts/upfront/bg-settings/image-item',
	'scripts/upfront/bg-settings/map-item',
	'scripts/upfront/bg-settings/slider-item',
	'scripts/upfront/bg-settings/video-item',
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/element-settings/advanced-settings',
	'scripts/perfect-scrollbar/perfect-scrollbar'
], function(ColorItem, ImageItem, MapItem, SliderItem, VideoItem, ElementSettings, RootSettingsPanel, AdvancedSettings, perfectScrollbar) {
	
	var BgItem = Upfront.Views.Editor.Settings.Item.extend({
		initialize: function (options) {
			var me = this,
				bg_image = this.model.get_breakpoint_property_value('background_image', true),
				types = [
					{ label: l10n.solid_color, value: 'color', icon: 'color' },
					{ label: l10n.image, value: 'image', icon: 'image' },
					{ label: l10n.video, value: 'video', icon: 'video' },
					{ label: l10n.image_slider, value: 'slider', icon: 'slider' },
					{ label: l10n.map, value: 'map', icon: 'map' }
				];
				
			if (_upfront_post_data.post_id) {
				types.push({ label: l10n.featured_image, value: 'featured', icon: 'feat' });
			}
			if ( _.isArray(options.enable_types) ) {
				types = _.filter(types, function(type){
					return _.contains(options.enable_types, type.value);
				});
			}
			
			options.fields = [
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-select background-type-field',
					label: l10n.background_type,
					property: 'background_type',
					use_breakpoint_property: true,
					default_value: !bg_image ? 'color' : 'image',
					icon_class: 'upfront-region-field-icon',
					values: types,
					change: function () {
						var value = this.get_value();
						me.panel.parent_view.panels[0].toggle_setting(value);
						this.model.set_breakpoint_property(this.property_name, value);
					}
				}),
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					property: 'use_padding',
					className: 'upfront-field-wrap upfront-field-wrap-multiple upfront-settings-item-content upfront-field-wrap-checkboxes padding-bg-checkbox-field',
					use_breakpoint_property: true,
					default_value: 0,
					layout: 'horizontal-inline',
					multiple: false,
					values: [ { label: l10n.use_theme_padding, value: 1 } ],
					change: function () {
						var value = this.get_value();
						this.model.set_breakpoint_property(this.property_name, value ? 1 : 0);
					}
				}),
			];
			this.$el.addClass('uf-bgsettings-item');
			this.constructor.__super__.initialize.call(this, options);
		},
	});
	
	var BgSettings = Upfront.Views.Editor.Settings.Settings.extend({
		initialize: function (options) {
			this.options = options;
			this.has_tabs = false;
			
			var me = this,
				types = {
					color: ColorItem, 
					image: ImageItem,
					featured: ImageItem,
					slider: SliderItem, 
					video: VideoItem, 
					map: MapItem
				}
			;
			if ( !_.isUndefined(options.enable_types) ) {
				this.enable_types = options.enable_types;
			}
			
			this.settings = {};
			
			_.each(types, function(view, type){
				if ( !_.contains(me.enable_types, type) ) return;
				me.settings[type] = new view({
					model: me.model
				});
				me.settings[type].once('rendered', function(){
					this.trigger('hide');
				});
			});
			
			var bg_item_options = {
					model: this.model,
					enable_types: this.enable_types
				};
			if ( this.bg_title ) {
				bg_item_options.title = this.bg_title;
			}
			else {
				bg_item_options.group = false;
			}
			var	bg_item = new BgItem(bg_item_options);
			
			this.panels = _([
	  	 		new Upfront.Views.Editor.Settings.Panel({
					model: this.model,
					settings: _.union(
						[ bg_item ],
						_.map(this.settings, function(setting){ return setting; })
					)
				})
	 		]);
	 		
	 		this.once('open', function(){
	 			var bg_type = me.model.get_breakpoint_property_value('background_type', true),
	 				bg_image = me.model.get_breakpoint_property_value('background_image', true);
	 			if ( bg_type ) {
	 				me.toggle_setting(bg_type);
				}
	 			else {
	 				me.toggle_setting( bg_image ? 'image' : 'color' );
				}
	 		});
		},
		
		toggle_setting: function (active) {
			_.each(this.settings, function(setting, type){
				if ( type == active ) {
					setting.trigger('show');
				}
				else {
					setting.trigger('hide');
				}
			});
		}
		
	});
	
	var GroupLayout = RootSettingsPanel.extend({
		className: 'upfront-settings_panel_wrap ugroup-settings',
		title: l10n.group_settings,
		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
			var me = this;
			
			this.listenTo(Upfront.Events, 'element:settings:render', this.settings_opened);
			this.on('body:rendered', this.on_body_render, this);

			var ColorSettings = new ColorItem({ model: this.model });
			var ImageSettings = new ImageItem({ model: this.model });
			
			var bg_item_options = {
					model: this.model,
					enable_types: ['color', 'image']
				};
			if ( this.bg_title )
				bg_item_options.title = this.bg_title;
			else
				bg_item_options.group = false;
			
			var	BgItemSettings = new BgItem(bg_item_options);

			this.settings = _({
				bgitem: BgItemSettings,
				color: ColorSettings,
				image: ImageSettings
			});
		},
		
		on_body_render: function () {
			var parent = this.$el.find('.uf-settings-panel__body');
			
			// Move padding checkbox to bottom
			this.$el.find('.padding-bg-checkbox-field').appendTo(parent);

			perfectScrollbar.initialize(parent[0], {
				suppressScrollX: true
			});
		},
		
		settings_opened: function() {
			var bg_type = this.model.get_breakpoint_property_value('background_type', true),
				bg_image = this.model.get_breakpoint_property_value('background_image', true);
			if ( bg_type )
				this.toggle_setting(bg_type);
			else
				this.toggle_setting( bg_image ? 'image' : 'color' );
		},
		
		toggle_setting: function (active) {
			_.each(this.settings._wrapped, function(setting, type){
				if ( type == active )
					setting.trigger('show');
				else
					setting.trigger('hide');
			});
		},
		
		get_label: function () {
			return l10n.group_bg;
		},
		
		get_title: function () {
			return l10n.group_bg;
		}
	});
	
	var GroupSettings = ElementSettings.extend({
		initialize: function (opts) {
			this.has_tabs = false;
			this.options = opts;
			this.for_view = this.options.for_view ? this.options.for_view : false;
			var panel = new GroupLayout(opts);
			this.panels = [
				panel,
				new AdvancedSettings({model: this.model})
			];
			
			// Listen to element deactivation and save setting automatically
			if ( this.for_view !== false ) {
				this.listenTo(this.for_view, 'deactivated', this.saveSettings);
			}
		},
		title: l10n.group_settings
	});

	Upfront.Views.Editor.BgSettings = {
		Settings: BgSettings,
		GroupSettings: GroupSettings,
		BgItem: BgItem,
		ColorItem: ColorItem,
		ImageItem: ImageItem,
		MapItem: MapItem,
		SliderItem: SliderItem,
		VideoItem: VideoItem
	};
});
})(jQuery);
