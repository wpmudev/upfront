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
				return _.template($template.find('#upfront-region-bg-setting-fixed').html());
			},

			render_main_settings: function ($content) {
				var region_restrict = new Fields.Checkboxes({
						model: this.model,
						name: 'restrict_to_container',
						default_value: '',
						layout: 'horizontal-inline',
						values: [
							{ label: l10n.restrict_to_parent, value: '1' }
						],
						change: function () {
							var value = this.get_value();
							this.model.set({restrict_to_container: value}, {silent: true});
							this.model.trigger('restrict_to_container', value);
							this.model.get('properties').trigger('change');
						},
						multiple: false
					})
				;

				this.render_fixed_settings($content.find('.upfront-region-bg-setting-fixed-region'));
				region_restrict.render();
				$content.find('.upfront-region-bg-setting-floating-restrict').append(region_restrict.$el);
				this.$el.addClass('upfront-modal-bg-settings-fixed')
			},

			render_fixed_settings: function ($content) {
				var me = this,
					grid = Upfront.Settings.LayoutEditor.Grid,
					top = this.model.get_property_value_by_name('top'),
					is_top = ( typeof top == 'number' ),
					left = this.model.get_property_value_by_name('left'),
					is_left = ( typeof left == 'number' ),
					bottom = this.model.get_property_value_by_name('bottom'),
					is_bottom = ( typeof bottom == 'number' ),
					right = this.model.get_property_value_by_name('right'),
					is_right = ( typeof right == 'number' ),
					set_value = function () {
						var value = this.get_value(),
							saved = this.get_saved_value();
						if ( value != saved ){
							switch ( this.options.property ){
								case 'top':
									this.model.remove_property('bottom', true); break;
								case 'bottom':
									this.model.remove_property('top', true); break;
								case 'left':
									this.model.remove_property('right', true); break;
								case 'right':
									this.model.remove_property('left', true); break;
							}
							this.property.set({'value': parseInt(value, 10)});
						}
					},
					fields = {
						width: new Upfront.Views.Editor.Field.Number({
							model: this.model,
							property: 'width',
							label: l10n.width + ':',
							label_style: "inline",
							min: 3 * grid.column_width,
							max: Math.floor(grid.size/2) * grid.column_width,
							change: set_value
						}),
						height: new Upfront.Views.Editor.Field.Number({
							model: this.model,
							property: 'height',
							label: l10n.height + ':',
							label_style: "inline",
							min: 3 * grid.baseline,
							change: set_value
						})
					};
				if ( is_top || !is_bottom )
					fields.top = new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: 'top',
						label: l10n.top + ':',
						label_style: "inline",
						min: 0,
						change: set_value
					});
				else
					fields.bottom = new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: 'bottom',
						label: l10n.bottom + ':',
						label_style: "inline",
						min: 0,
						change: set_value
					});
				if ( is_left || !is_right )
					fields.left = new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: 'left',
						label: l10n.left + ':',
						label_style: "inline",
						min: 0,
						change: set_value
					});
				else
					fields.right = new Upfront.Views.Editor.Field.Number({
						model: this.model,
						property: 'right',
						label: l10n.right + ":",
						label_style: "inline",
						min: 0,
						change: set_value
					});
				_.each(fields, function(field){
					field.render();
					field.delegateEvents();
					$content.append(field.$el);
				});
			}
		});

	});
}(jQuery));
