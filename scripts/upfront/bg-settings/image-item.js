(function($) {

var l10n = Upfront.Settings && Upfront.Settings.l10n
	? Upfront.Settings.l10n.global.views
	: Upfront.mainData.l10n.global.views
;

define([
	'scripts/upfront/bg-settings/mixins'
], function(Mixins) {

	var ImageItem = Upfront.Views.Editor.Settings.Item.extend(_.extend({}, Mixins, {
		group: false,
		initialize: function (options) {
			var me = this,
				pos_option = {
					default_value: 50,
					min: 0,
					max: 100,
					step: 1
				},
				toggle_bg_size = this.toggle_bg_size_field(),
				tile_fields = ['bg_tile'],
				fixed_fields = ['bg_color', 'bg_position_x', 'bg_position_y', 'bg_position_x_num', 'bg_position_y_num', 'use_bg_size', 'bg_size'],
				parallax_fields = ['origin_position_x', 'origin_position_y', 'origin_position_x_num', 'origin_position_y_num', 'use_bg_size', 'bg_size'],
				fields = {
					pick_image: new Upfront.Views.Editor.Field.Button({
						label: l10n.browse,
						compact: true,
						classname: 'uf-button-alt uf-bgsettings-image-pick',
						on_click: function(){
							me.upload_image();
						}
					}),
					bg_style: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.image_type,
						className: 'upfront-field-wrap upfront-field-wrap-select background-image-field',
						property: 'background_style',
						use_breakpoint_property: true,
						default_value: 'full',
						icon_class: 'upfront-region-field-icon',
						values: this.get_bg_style_values(),
						change: function () {
							var value = this.get_value();
							if ( value === 'tile' ){
								_.each(tile_fields, function(key){ fields[key].$el.show(); });
								_.each(fixed_fields, function(key){ fields[key].$el.hide(); });
								_.each(parallax_fields, function(key){ fields[key].$el.hide(); });
							} else if ( value === 'fixed' ){
								_.each(tile_fields, function(key){ fields[key].$el.hide(); });
								_.each(parallax_fields, function(key){ fields[key].$el.hide(); });
								_.each(fixed_fields, function(key){
										if ( fields[key].property_name == 'background_size_percent' ) {
											var use_bg_size_value = me.model.get_breakpoint_property_value('use_background_size_percent', true) || false;
											if ( use_bg_size_value !== false ) fields[key].$el.show(); 
										} else {
											fields[key].$el.show(); 
										}
								});
							} else if (value === 'parallax') {
								_.each(tile_fields, function(key){ fields[key].$el.hide(); });
								_.each(fixed_fields, function(key){ fields[key].$el.hide(); });
								_.each(parallax_fields, function(key){
									if ( fields[key].property_name == 'background_size_percent' ) {
										var use_bg_size_value = me.model.get_breakpoint_property_value('use_background_size_percent', true) || false;
										if ( use_bg_size_value !== false ) fields[key].$el.show(); 
									} else {
										fields[key].$el.show(); 
									}
								});
							} else {
								_.each(tile_fields, function(key){ fields[key].$el.hide(); });
								_.each(fixed_fields, function(key){ fields[key].$el.hide(); });
								_.each(parallax_fields, function(key){ fields[key].$el.hide(); });
							}
							me._bg_style = value;
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-style');
						}
					}),
					bg_tile: new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						layout: 'horizontal-inline',
						default_value: ['y', 'x'],
						values: [
							{ label: l10n.tile_vertically, value: 'y' },
							{ label: l10n.tile_horizontally, value: 'x' }
						],
						change: function () {
							var value = this.get_value();
							me._bg_tile = value;
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-tile');
						}
					}),
					bg_color: new Upfront.Views.Editor.Field.Color({
						model: this.model,
						label: l10n.bg_color_short,
						property: 'background_color',
						use_breakpoint_property: true,
						default_value: '#ffffff',
						spectrum: {
							move: function (color) {
								me.preview_color(color);
							},
							change: function (color) {
								me.update_color(color);
							},
							hide: function (color) {
								me.reset_color();
							}
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-color');
						}
					}),
					bg_position_y: new Upfront.Views.Editor.Field.Slider(_.extend({
						model: this.model,
						label: l10n.image_position,
						orientation: 'vertical',
						property: 'background_position_y',
						use_breakpoint_property: true,
						range: false,
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value();
							fields.bg_position_y_num.get_field().val(value);
							me._bg_position_y = value;
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-y');
						}
					}, pos_option)),
					bg_position_x: new Upfront.Views.Editor.Field.Slider(_.extend({
						model: this.model,
						property: 'background_position_x',
						use_breakpoint_property: true,
						range: false,
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value();
							fields.bg_position_x_num.get_field().val(value);
							me._bg_position_x = value;
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-x');
						}
					}, pos_option)),
					bg_position_y_num: new Upfront.Views.Editor.Field.Number(_.extend({
						model: this.model,
						label: "Y:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							var value = this.get_value(),
								s = fields.bg_position_y;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-y-num');
						}
					}, pos_option)),
					bg_position_x_num: new Upfront.Views.Editor.Field.Number(_.extend({
						model: this.model,
						label: "X:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value(),
								s = fields.bg_position_x;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-x-num');
						}
					}, pos_option)),
					origin_position_y: new Upfront.Views.Editor.Field.Slider(_.extend({
						model: this.model,
						label: l10n.origin_position,
						orientation: 'vertical',
						property: 'origin_position_y',
						use_breakpoint_property: true,
						range: false,
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value();
							fields.origin_position_y_num.get_field().val(value);
							me._origin_position_y = value;
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-y');
						}
					}, {
							default_value: 50,
							min: -50,
							max: 150,
							step: 1
						})),
					origin_position_x: new Upfront.Views.Editor.Field.Slider(_.extend({
						model: this.model,
						property: 'origin_position_x',
						use_breakpoint_property: true,
						range: false,
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value();
							fields.origin_position_x_num.get_field().val(value);
							me._origin_position_x = value;
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-x');
						}
					}, {
							default_value: 50,
							min: -50,
							max: 150,
							step: 1
						})),
					origin_position_y_num: new Upfront.Views.Editor.Field.Number(_.extend({
						model: this.model,
						label: "Y:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value(),
								s = fields.origin_position_y;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-y-num uf-bgsettings-origin-pos-y-num');
						}
					}, {
							default_value: 50,
							min: -50,
							max: 150,
							step: 1
						})),
					origin_position_x_num: new Upfront.Views.Editor.Field.Number(_.extend({
						model: this.model,
						label: "X:",
						label_style: 'inline',
						suffix: '%',
						change: function () {
							// Update fixed and parallax sliders on change.
							var value = this.get_value(),
								s = fields.origin_position_x;
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-pos-x-num uf-bgsettings-origin-pos-x-num');
						}
					}, {
							default_value: 50,
							min: -50,
							max: 150,
							step: 1
						})),
					use_bg_size: new toggle_bg_size({
						model: this.model,
						property: 'use_background_size_percent',
						label: '',
						multiple: false,
						use_breakpoint_property: true,
						values: [
							{ label: l10n.resize_image, value: 'yes' }
						],
						change: function() {
							var value = this.get_value(),
								$bg_image_size = me.$el.find('.uf-bgsettings-image-size'),
								use_bg_size = value || false
							;
							this.model.set_breakpoint_property(this.property_name, value);
							// update size percent to 100
							$bg_image_size.find('input[name="background_size_percent"]').val(100);
							me.model.set_breakpoint_property('background_size_percent', 100);
							if ( use_bg_size === false ) {
								$bg_image_size.hide();
								// update image to auto
								me._bg_size = 'auto';
								me.update_image();
							} else {
								me._bg_size = 100;
								me.update_image();
								$bg_image_size.show();
							}
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-use-image-size');
						}
					}),
					bg_size: new Upfront.Views.Editor.Field.Number(_.extend({
						model: this.model,
						property: 'background_size_percent',
						label: '',
						use_breakpoint_property: true,
						suffix: l10n.resize_image_percent,
						change: function () {
							var value = this.get_value();
							me._bg_size = value;
							// Value separate from 'background_size' without percent suffix for populating input.
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-image-size');
						}
					}, {
							default_value: 100,
							min: 0,
							max: 1000,
							step: 1
						}
					)),
					bg_default: new Upfront.Views.Editor.Field.Select({
						model: this.model,
						label: l10n.featured_default,
						className: 'upfront-field-wrap upfront-field-wrap-select background-image-field',
						property: 'background_default',
						use_breakpoint_property: true,
						default_value: 'hide',
						icon_class: 'upfront-region-field-icon',
						values: [
							{ label: l10n.featured_default_hide, value: 'hide' },
							{ label: l10n.featured_default_color, value: 'color' },
							{ label: l10n.featured_default_image, value: 'image' }
						],
						change: function () {
							var value = this.get_value(),
								bg_image = me.model.get_breakpoint_property_value('background_image', true)
							;
							this.$el.removeClass('uf-bgsettings-image-default-image uf-bgsettings-image-default-color uf-bgsettings-image-default-hide');
							if ( value == 'image' ){
								// fields.pick_image.$el.show();
								fields.featured_fallback_pick_image.$el.show();
								fields.featured_fallback_bg_color.$el.hide();
								this.$el.addClass('uf-bgsettings-image-default-image');
								if ( !bg_image ) me.upload_image();
							} else if ( value == 'color' ) {
								// fields.pick_image.$el.hide();
								fields.featured_fallback_bg_color.$el.show();
								fields.featured_fallback_pick_image.$el.hide();
								this.$el.addClass('uf-bgsettings-image-default-color');
							} else if ( value == 'featured' ) {
								// fields.pick_image.$el.show();
								fields.featured_fallback_bg_color.$el.hide();
								this.$el.addClass('uf-bgsettings-image-default-image');
							}
							else {
								// fields.pick_image.$el.hide();
								fields.featured_fallback_bg_color.$el.hide();
								fields.featured_fallback_pick_image.$el.hide();
								this.$el.addClass('uf-bgsettings-image-default-hide');
							}
							this.model.set_breakpoint_property(this.property_name, value);
							me.update_image();
						},
						rendered: function (){
							var value = this.get_saved_value();
							this.$el.addClass('uf-bgsettings-image-default');
							if ( value == 'image' ) {
								this.$el.addClass('uf-bgsettings-image-default-image');
							}
							else if ( value == 'color' ) {
								this.$el.addClass('uf-bgsettings-image-default-color');
							}
							else {
								this.$el.addClass('uf-bgsettings-image-default-hide');
							}
						}
					}),
					featured_fallback_bg_color: new Upfront.Views.Editor.Field.Color({
						model: this.model,
						label: l10n.bg_color_short,
						property: 'featured_fallback_background_color',
						use_breakpoint_property: true,
						default_value: '#ffffff',
						spectrum: {
							move: function (color) {
								// notify that we are editing featured fallback bg color
								me.is_featured_fallback_bg_color = true;
								me.preview_color(color);
								// reset
								me.is_featured_fallback_bg_color = false;
							},
							change: function (color) {
								// notify that we are editing featured fallback bg color
								me.is_featured_fallback_bg_color = true;
								me.update_color(color);
								// reset
								me.is_featured_fallback_bg_color = false;
							},
							hide: function (color) {
								// notify that we are editing featured fallback bg color
								me.is_featured_fallback_bg_color = true;
								me.reset_color();
								// reset
								me.is_featured_fallback_bg_color = false;
							}
						},
						rendered: function (){
							this.$el.addClass('uf-bgsettings-featured-fallback-image-color');
						}
					}),
					featured_fallback_pick_image: new Upfront.Views.Editor.Field.Button({
						label: l10n.browse,
						compact: true,
						classname: 'uf-button-alt uf-bgsettings-featured-fallback-image-pick',
						on_click: function(){
							me.upload_image();
						}
					})
				};
			
			this.$el.addClass('uf-bgsettings-item uf-bgsettings-imageitem');
			options.fields = _.map(fields, function(field){ return field; });

			this.on('show', function(){
				var bg_type = me.model.get_breakpoint_property_value('background_type', true),
					bg_image = me.model.get_breakpoint_property_value('background_image', true),
					bg_default = me.model.get_breakpoint_property_value('background_default', true)
				;
				me._bg_style = fields.bg_style.get_value();
				me._bg_tile = fields.bg_tile.get_value();
				me._bg_size = fields.bg_size.get_value();
				fields.bg_size.trigger('changed');
				me._bg_position_y = fields.bg_position_y.get_value();
				fields.bg_position_y.trigger('changed');
				me._origin_position_y = fields.origin_position_y.get_value();
				fields.origin_position_y.trigger('changed');
				me._bg_position_x = fields.bg_position_x.get_value();
				fields.bg_position_x.trigger('changed');
				me._origin_position_x = fields.origin_position_y.get_value();
				fields.origin_position_x.trigger('changed');
				//me._default_color = fields.bg_color.get_value();
				fields.bg_style.trigger('changed');
				if ( bg_type == 'featured' ) {
					fields.pick_image.$el.hide();
					fields.bg_default.$el.show();
					fields.bg_default.trigger('changed');
				} else {
					if ( bg_type == 'image' ) fields.pick_image.$el.show();
					fields.bg_default.$el.hide();
					fields.featured_fallback_bg_color.$el.hide();
					fields.featured_fallback_pick_image.$el.hide();
					if ( !bg_image ) me.upload_image();
				}
			});

			this.bind_toggles();
			this.constructor.__super__.initialize.call(this, options);
		},
		toggle_bg_size_field: function () {
			var toggleField = Upfront.Views.Editor.Field.Checkboxes.extend({
				get_value_html: function (value, index) {
					var id = this.get_field_id() + '-' + index;
					var classes = "upfront-field-multiple";
					var attr = {
						'type': this.type,
						'id': id,
						'name': this.get_field_name(),
						'value': value.value,
						'class': 'upfront_toggle_checkbox upfront-field-' + this.type
					};
					var saved_value = this.get_saved_value();
					var icon_class = this.options.icon_class ? this.options.icon_class : null;
					if ( this.options.layout ) classes += ' upfront-field-multiple-'+this.options.layout;
					if ( value.disabled ) {
						attr.disabled = 'disabled';
						classes += ' upfront-field-multiple-disabled';
					}
					if ( this.multiple && _.contains(saved_value, value.value) ) {
						attr.checked = 'checked';
					} else if ( ! this.multiple && saved_value == value.value ) {
						attr.checked = 'checked';
					}
					if (value.checked) attr.checked = 'checked';
					if ( attr.checked ) {
						classes += ' upfront-field-multiple-selected';
					}
					return '<div class="' + classes + ' upfront_toggle"><span class="upfront-field-label-text">' + value.label + '</span><input ' + this.get_field_attr_html(attr) + ' />' + '<label for="' + id + '" class="upfront_toggle_label"><span class="upfront_toggle_switch"></span></label></div>';
				}
			});
			return toggleField;
		},
		update_image: function () {
			var style = this._bg_style,
				tile = this._bg_tile,
				is_repeat_y = _.contains(tile, 'y'),
				is_repeat_x = _.contains(tile, 'x'),
				pos_y = this._bg_position_y,
				pos_x = this._bg_position_x,
				use_bg_size_value = this.model.get_breakpoint_property_value('use_background_size_percent', true) || false,
				bg_size = ( use_bg_size_value === false && this._bg_size !== 'auto' ) ? 'auto' : this._bg_size
			;
			if ( style == 'full' ) {
				this.model.set_breakpoint_property('background_style', 'full');
			}
			else {
				if ( style == 'tile' ) {
					this.model.set_breakpoint_property('background_style', 'tile');
					if ( is_repeat_x && is_repeat_y ) {
						this.model.set_breakpoint_property('background_repeat', 'repeat');
					}
					else if ( is_repeat_y ) {
						this.model.set_breakpoint_property('background_repeat', 'repeat-y');
					}
					else if ( is_repeat_x ) {
						this.model.set_breakpoint_property('background_repeat', 'repeat-x');
					}
					else {
						this.model.set_breakpoint_property('background_repeat', 'no-repeat');
					}
				} else if ( style == 'fixed' ) {
					this.model.set_breakpoint_property('background_style', 'fixed');
					this.model.set_breakpoint_property('background_repeat', 'no-repeat');
					this.model.set_breakpoint_property('background_position', pos_x + '% ' + pos_y + '%');
					this.model.set_breakpoint_property('background_size', ( bg_size == 'auto' ) ? bg_size : (bg_size + '%') );
				} else if (style === 'parallax') {
					this.model.set_breakpoint_property('background_style', 'parallax');
					this.model.set_breakpoint_property('background_position', this._origin_position_x + '% ' + this._origin_position_y + '%');
					this.model.set_breakpoint_property('background_size', ( bg_size == 'auto' ) ? bg_size : (bg_size + '%') );
				} else {
					this.model.set_breakpoint_property('background_style', style);
				}
			}
		},
		get_bg_style_values: function () {
			var values = [
				{ label: l10n.full_width_bg, value: 'full', icon: 'bg-image-full' },
				{ label: l10n.tiled_pattern, value: 'tile', icon: 'bg-image-tile' },
				{ label: l10n.fixed_position, value: 'fixed', icon: 'bg-image-fixed' }
			];
			if ( this.model instanceof Upfront.Models.Region ) {
				values.push({ label: l10n.parallax, value: 'parallax', icon: 'bg-image-full' });
			}
			return values;
		}
	}));

	return ImageItem;
});
})(jQuery);
