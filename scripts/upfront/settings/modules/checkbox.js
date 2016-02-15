/**
 * Field names properies
 * `checkbox` - Enable / Disable
 */

define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var CheckboxSettingsModule = BaseModule.extend({
		className: 'settings_module checkbox_settings_item clearfix',
		group: false,

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;
				
			var TooltipField = Upfront.Views.Editor.Field.Text.extend({
				get_field_html: function () {
					return '<button class="checkbox-tooltip" title="' + me.options.tooltip_label +'">&nbsp;</button>';
				}
			});	

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'checkbox-module checkbox-title',
					name: me.options.fields.checkbox,
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: me.options.label, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.checkbox, value);
					},
					show: function(value, $el) {

					}
				})
			]);
			
			if(typeof me.options.tooltip !== "undefined" && me.options.tooltip) {
				this.fields.push(
					new TooltipField({
						model: this.model,
						label: '',
						className: 'tooltip-icon',
					})
				);
			}
		},
	});

	return CheckboxSettingsModule;
});
