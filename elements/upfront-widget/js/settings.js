(function ($) {
define([
	'scripts/upfront/element-settings',
	'scripts/upfront/element-settings-panel'
], function (ElementSettings, ElementSettingsPanel) {
	var l10n = Upfront.Settings.l10n.widget_element;

	// Settings - load widget list first before adding object
	var WidgetSpecific_Settings = Upfront.Views.Editor.Settings.Item.extend({
		/**
		 * Set up setting item appearance.
		 */

		get_title: function () {
			var selected = this.model.get_property_value_by_name('selected_widget');
			for (i in Upfront.data.uwidget.widgets) {
				// Normal mode
				if (Upfront.data.uwidget.widgets[i].key == selected) {
					return Upfront.data.uwidget.widgets[i].name;
				}
				// For legacy stuff, check the initialize method
			}
			return this.model.get_property_value_by_name('widget') || l10n.select_one;
		},

		update_settings: function (widget, parent) {
			var self = this,
				data = {"action": "uwidget_get_widget_admin_form", "data": JSON.stringify({"widget": widget})}
			;

			this.$el.empty().append('<p>' + l10n.loading + '</p>');

			Upfront.Util.post(data)
				.success(function (ret) {
					self.model.set_property('widget_specific_fields', ret.data);
					self.$el.empty();
					self.model.set_property('selected_widget', widget);
					self.model.set_property('widget', widget);
					self.update_fields();

					self.render();
				}).error(function (ret) {
					console.log("error receiving widget specific settings");
				})
			;
		},

		initialize: function () {
			var widget = this.model.get_property_value_by_name('widget');

			// Check legacy mode
			// And internally convert accordingly
			for (i in Upfront.data.uwidget.widgets) {
				if (Upfront.data.uwidget.widgets[i]['class'] == widget) {
					widget = Upfront.data.uwidget.widgets[i]['key'];
					this.model.set_property('widget', widget, true);
					this.model.set_property('selected_widget', widget, true);
					break;
				}
			};

			this.model.set_property('selected_widget', widget);
			this.update_fields();
		},

		render: function () {
			var widget = this.model.get_property_value_by_name('selected_widget');
			if (widget && this.fields.isEmpty()) {
				this.$el.empty().append('<p>' + l10n.missing_admin_data + '</p>');
			} else this.constructor.__super__.render.call(this);
		},

		update_fields: function () {
			var self = this;
			this.fields=_([]);
			var specific_fields = this.model.get_property_value_by_name('widget_specific_fields');

			for (key in specific_fields) {
				if (specific_fields[key]['type'] == 'select') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						values: _.map(specific_fields[key]['options'], function(option, key){ return { label: option, value: key }; }),
						change: this.clear_cache
					});
				} else if (specific_fields[key]['type'] == 'text') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				} else if (specific_fields[key]['type'] == 'textarea') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				} else if (specific_fields[key]['type'] == 'checkbox') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Checkboxes({
						model: this.model,
						property: specific_fields[key]['name'],
						label: '',
						values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
						change: this.clear_cache
					});
				} else if (specific_fields[key]['type'] == 'radio') {
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

		clear_cache: function (val) {
			this.model.cache.clear();
		}
	});


	var Settings = ElementSettings.extend({

		initialize: function (opts) {
			this.has_tabs = false;
			this.options= opts;

			var widget_values = _(_.filter(Upfront.data.uwidget.widgets, function (each) {
				return each.admin;
			})).map(function (each) {
				return { label: each.name, value: each.key };
			});
			widget_values.unshift({label: l10n.select_one, value: ''});

			var panel = new ElementSettingsPanel({
				model: this.model,
				label: l10n.widget,
				title: l10n.settings,
				min_height: '200px'
			});

			var dynamic_settings = new WidgetSpecific_Settings({model: this.model}),
				me = this
			;

			var settings_item1 = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.widget_select,
				fields: [
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: 'widget',
						label: "",
						values: widget_values,
						change: function() {
							var $checked = this.$el.find('.upfront-field-select-option input:checked');
							if(this.model.get_property_value_by_name('selected_widget') != $checked.val())
								me.model.cache.set($checked.val(), false); // Reset individual cache item on change.
								dynamic_settings.update_settings($checked.val(), this);
							}
					})
				]
			});
			panel.settings = _([settings_item1, dynamic_settings]);

			this.panels = _([panel]);
		},

		get_title: function () {
			return l10n.settings;
		}
	});

	return Settings;
});
})(jQuery);
