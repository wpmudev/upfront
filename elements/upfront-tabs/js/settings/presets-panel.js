define([
	'elements/upfront-tabs/js/settings/presets-item'
], function(PresetsItem) {
	var PresetsPanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'preset-manager-panel',

		initialize: function (opts) {
			this.options = opts;
			var me = this;

			var newpresetname = new Upfront.Views.Editor.Field.Text({
				model: this.model,
				compact: true,
				className: 'new_preset_name'
			});

			this.newpresets = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: 'Or',
				className: 'or_divider',
				fields: [
					newpresetname,
					new Upfront.Views.Editor.Field.Button({
						model: this.model,
						label: 'New Preset',
						className: 'new_preset',
						compact: true,
						on_click: function() {
							if (newpresetname.$el.find('input').val().trim() !== '') {
								me.property('currentpreset',  newpresetname.$el.find('input').val(), true);
								me.ready_preset();
							}
						}
					})
				]
			});

			this.presets = new PresetsItem({
				model: this.model,
				title: 'Select Preset'
			});
			this.settings = _([
				this.presets,
				this.newpresets
			]);
		},

		property: function(name, value, silent) {
			if (typeof value !== 'undefined'){
				if (typeof silent === 'undefined') {
					silent = true;
				}
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		},
		get_label: function () {
			return 'Appearance';
		}
	});

	return PresetsPanel;
});
