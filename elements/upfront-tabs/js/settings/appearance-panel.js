define(function() {
	var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'utabs-settings-panel',
		initialize: function (opts) {
			this.options = opts;

			this.settings = _([
				new Upfront.Views.Editor.Settings.Item({
					model: this.model,
					title: 'Display style',
					fields: [
					]
				})
			]);
		},

		get_label: function () {
			return 'Appearance';
		},

		get_title: function () {
			return false;
		},

		property: function(name, value, silent) {
			if(typeof value !== 'undefined'){
				if(typeof silent === 'undefined') {
					silent = true;
				}
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		}
	});

	return AppearancePanel;
});
