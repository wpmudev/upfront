define([], function () {
	var SaveableSettingsPanel = Backbone.View.extend({
		save_settings: function () {
			if (!this.settings) return;

			var me = this;
			this.settings.each(function (setting) {
				if ( (setting.fields || setting.settings).size() > 0 ) {
					setting.save_fields();
				} else {
					var value = me.model.get_property_value_by_name(setting.get_name());
					if ( value != setting.get_value() ) {
						me.model.set_property(
							setting.get_name(),
							setting.get_value()
						);
					}
				}
			});
		}
	});

	return SaveableSettingsPanel;
});
