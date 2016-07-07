define([], function () {
	var SettingsContainer = Backbone.View.extend({
		save_settings: function () {
			if (!this.settings) return;

			var me = this;
			this.settings.each(function (setting) {
				if ( !setting.handlesSaving && (setting.fields || setting.settings).size() > 0 ) {
					setting.save_fields();
				} else  if (!setting.handlesSaving) {
					var value = me.model.get_property_value_by_name(setting.get_name());
					if ( value != setting.get_value() ) {
						me.model.set_property(
							setting.get_name(),
							setting.get_value()
						);
					}
				}
			});
			// some backward compatibility
			if (this.on_save) this.on_save();
			if (this.onSaveSettings) this.onSaveSettings();
		},

		cleanUp: function() {
			if(this.settings) {
				this.settings.each(function(setting){
					if ((setting || {}).remove) setting.remove();
				});
			}

			this.$el.off();
			this.remove();
		}

	});

	return SettingsContainer;
});
