(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		'scripts/upfront/upfront-views-editor/region/region-bg-setting',
		'scripts/upfront/upfront-views-editor/fields',
		"text!upfront/templates/region_edit_panel.html"
	], function (RegionBgSetting, Fields, region_edit_panel_tpl) {


		return RegionBgSetting.extend({
			get_template: function () {
				var $template = $(region_edit_panel_tpl);
				return _.template($template.find('#upfront-region-bg-setting-lightbox').html());
			},

			render_main_settings: function ($content) {
				this.render_lightbox_settings($content.find('.upfront-region-bg-setting-lightbox-region'));
			},

			render_lightbox_settings: function ($content) {
				var me = this,
					grid = Upfront.Settings.LayoutEditor.Grid,
					/*top = this.model.get_property_value_by_name('top'),
					 is_top = ( typeof top == 'number' ),
					 left = this.model.get_property_value_by_name('left'),
					 is_left = ( typeof left == 'number' ),
					 bottom = this.model.get_property_value_by_name('bottom'),
					 is_bottom = ( typeof bottom == 'number' ),
					 right = this.model.get_property_value_by_name('right'),
					 is_right = ( typeof right == 'number' ),*/
					set_value = function (object) {

						me = object.$spectrum?object:this;

						var value = me.get_value(),
							saved = me.get_saved_value();
						if ( value != saved ){
							me.property.set({'value': value});
						}
					},
					fields = {
						width: new Upfront.Views.Editor.Field.Number({
							model: this.model,
							property: 'col',
							className: 'upfront-field-wrap upfront-field-wrap-number width_cols',
							label: l10n.col_width + ":",
							label_style: "inline",
							min: 3,// * grid.column_width,
							max: 24,//Math.floor(grid.size/2) * grid.column_width,
							change: set_value
						}),
						height: new Upfront.Views.Editor.Field.Number({
							model: this.model,
							property: 'height',
							label: l10n.px_height + ":",
							label_style: "inline",
							min: 3 * grid.baseline,
							max: 99999,
							change: set_value
						}),
						click_out_close: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: 'click_out_close',
							label: "",
							values: [
								{ label: l10n.click_close_ltbox, value: 'yes', checked: this.model.get_property_value_by_name('click_out_close') == 'yes' ? 'checked' : false }
							],
							change: set_value
						}),
						show_close: new Upfront.Views.Editor.Field.Checkboxes({
							model: this.model,
							property: 'show_close',
							label: "",
							values: [
								{ label: l10n.show_close_icon, value: 'yes', checked: this.model.get_property_value_by_name('show_close') == 'yes' ? 'checked' : false }
							],
							change: set_value
						})/*,
						 add_close_text: new Upfront.Views.Editor.Field.Checkboxes({
						 model: this.model,
						 property: 'add_close_text',
						 label: "",
						 values: [
						 { label: l10n.add_close_text, value: 'yes', checked: this.model.get_property_value_by_name('add_close_text') == 'yes' ? 'checked' : false }
						 ],
						 change: set_value
						 }),
						 close_text: new Upfront.Views.Editor.Field.Text({
						 model: this.model,
						 default_value: l10n.close,
						 property: 'close_text',
						 label_style: "inline",
						 change: set_value
						 })*/
					};

				fields.overlay_color = new Upfront.Views.Editor.Field.Color({
					model: this.model,
					property: 'overlay_color',
					className: 'upfront-field-wrap upfront-field-wrap-color sp-cf overlay_color',
					default_value: 'rgba(38,58,77,0.75)',
					label: l10n.overlay_bg + ":",
					change: set_value,
					spectrum: {
						move: function(color) {
							var rgb = color.toRgb(),
								rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
							fields.overlay_color.get_field().val(rgba_string);
							set_value(fields.overlay_color);
						},
						change: function(color) {
							var rgb = color.toRgb(),
								rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
							fields.overlay_color.get_field().val(rgba_string);
							set_value(fields.overlay_color);
						}
					}
				});

				fields.lightbox_color = new Upfront.Views.Editor.Field.Color({
					model: this.model,
					property: 'lightbox_color',
					default_value: 'rgba(248,254,255,0.9)',
					label: l10n.active_area_bg + ":",
					change: set_value,
					spectrum: {
						move: function(color) {
							var rgb = color.toRgb(),
								rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
							fields.lightbox_color.get_field().val(rgba_string);
							set_value(fields.lightbox_color);
						},
						change: function(color) {
							var rgb = color.toRgb(),
								rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
							fields.lightbox_color.get_field().val(rgba_string);
							set_value(fields.lightbox_color);
						}
					}
				});

				_.each(fields, function(field){
					field.render();
					field.delegateEvents();
					$content.append(field.$el);
				});

				this.model.set_property('delete', false);
				var me = this;

				$content.on('click', 'a.upfront-entity-delete_trigger', function() {
					me.model.set_property('delete', true);
					me.close();
				});

				$content.closest('.upfront-inline-modal-wrap').draggable();
			},
			update_lightbox_overlay: function(color) {
				var rgb = color.toRgb(),
					rgba_string = 'rgba('+rgb.r+','+rgb.g+','+rgb.b+','+color.alpha+')';
			}
		});

	});
}(jQuery));
