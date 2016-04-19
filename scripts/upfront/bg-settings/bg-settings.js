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
	'scripts/upfront/bg-settings/video-item'
], function(ColorItem, ImageItem, MapItem, SliderItem, VideoItem) {
	
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
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					property: 'use_padding',
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
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: 'upfront-field-wrap upfront-field-wrap-select background-type-field',
					label: l10n.group_bg,
					property: 'background_type',
					use_breakpoint_property: true,
					default_value: !bg_image ? 'color' : 'image',
					icon_class: 'upfront-region-field-icon',
					values: types,
					change: function () {
						var value = this.get_value();
						me.panel.parent_view.toggle_setting(value);
						this.model.set_breakpoint_property(this.property_name, value);
					}
				})
			];
			this.$el.addClass('uf-bgsettings-item');
			this.constructor.__super__.initialize.call(this, options);
		}
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

	Upfront.Views.Editor.BgSettings = {
		Settings: BgSettings,
		BgItem: BgItem,
		ColorItem: ColorItem,
		ImageItem: ImageItem,
		MapItem: MapItem,
		SliderItem: SliderItem,
		VideoItem: VideoItem
	};
});
})(jQuery);
