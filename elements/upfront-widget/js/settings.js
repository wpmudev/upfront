(function ($) {
define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel'
], function (ElementSettings, RootSettingsPanel) {
	var l10n = Upfront.Settings.l10n.widget_element;

	// Widget element's settings consist of a static settings block and a dynamic one
	// Static settings consist of a dropdown that lets you choose a specific widget to be rendered
	// Dynamic settings is an instance of UwidgetSpecific_Settings defined following this comments block
	// Dynamic settings loads widget specific settings (based on the selection made in the dropdown) into the panel


	/**
	 * Widget Specific Settings contain the logic to load widget settings for the current selected widget type.
	 */
	var UwidgetSpecific_Settings = Upfront.Views.Editor.Settings.Item.extend({

		get_title: function(){
			for(i in Upfront.data.uwidget.widgets) {
				if(Upfront.data.uwidget.widgets[i].key === this.model.get_property_value_by_name('selected_widget'))
					return Upfront.data.uwidget.widgets[i].name
			}
			if(this.model.get_property_value_by_name('widget'))
				return this.model.get_property_value_by_name('widget');
			else
				return '';
		},
		update_settings: function(widget, parent) {
			var self = this,
				data = {"action": "uwidget_get_widget_admin_form", "data": JSON.stringify({"widget": widget})}
			;
			Upfront.Util.post(data)
			.success(function (ret) {
				self.model.set_property('widget_specific_fields', ret.data);
				self.$el.html('');
				self.model.set_property('selected_widget', widget);
				self.model.set_property('widget', widget);
				self.udpate_fields();
				self.render();
			}).error(function (ret) {
				console.log("error receiving widget specific settings");
			});


		},
		initialize: function() {
			this.model.set_property('selected_widget', this.model.get_property_value_by_name('widget'));
			this.udpate_fields();

		},
		udpate_fields: function() {
			var self = this;
			this.fields=_([]);
			var specific_fields = this.model.get_property_value_by_name('widget_specific_fields');

			for( key in specific_fields) {
				if(specific_fields[key]['type'] == 'select') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						values: _.map(specific_fields[key]['options'], function(option, key){ return { label: option, value: key }; }),
						change: this.clear_cache

					});
				}
				else if(specific_fields[key]['type'] == 'text') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'textarea') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'checkbox') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: specific_fields[key]['name'],
						label: '',
						values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'radio') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: specific_fields[key]['name'],
						label: '',
						values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
						change: this.clear_cache
					});

				}
			}
		},
		clear_cache: function() { Upfront.data.uwidget.widgets_cache = {}; }
	});

	/**
	 * Widget settings to be returned. Contains logic to populate widget types dropdown list
	 * and triggers the instance dynamic_settings to re-render with new settings for the specific widget type selected.
	 */
	var UwidgetSettings = ElementSettings.extend({

		initialize: function (opts) {
			//this.has_tabs = false;
			//this.options= opts;

			this.constructor.__super__.initialize.call(this, opts);

			var widget_values = _(_.filter(Upfront.data.uwidget.widgets, function (each) {
				return each.admin;
			})).map(function (each) {
				return { label: each.name, value: each.key };
			});

			// Add a default 'select' value
			widget_values.unshift({label: "Select  a widget", value: ''});

			var panel = new RootSettingsPanel({
				className: 'upfront-settings_panel_wrap widget-settings',
				title: l10n.settings,
			});

			var dynamic_settings = new UwidgetSpecific_Settings({model: this.model});

			var static_settings = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.widget_select,
				fields: [
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: 'widget',
						values: widget_values,
						change: function(value) {
							if( this.model.get_property_value_by_name('selected_widget') !== value )	
								dynamic_settings.update_settings(value, this);

						}
					})
				]
			});

			var css_settings = new Upfront.Views.Editor.Settings.Settings_CSS({
				model: this.model,
				title: 'hey there'
			})


			panel.settings = _([static_settings, dynamic_settings, css_settings]);

			this.panels = _.extend({General: panel}, this.panels);
		},
		
		title: l10n.settings
		
	});


	return UwidgetSettings;
});
})(jQuery);
