(function ($) {
define([
	'scripts/upfront/element-settings/settings',
	'scripts/upfront/element-settings/root-settings-panel',
	'scripts/upfront/preset-settings/util',
	'text!elements/upfront-widget/tpl/preset-style.html'
], function (ElementSettings, RootSettingsPanel, Util, styleTpl) {
	var l10n = Upfront.Settings.l10n.widget_element;

	var current_widget = false,
		selected_widget = false;

	// Widget element's settings consist of a static settings block and a dynamic one
	// Static settings consist of a dropdown that lets you choose a specific widget to be rendered
	// Dynamic settings is an instance of UwidgetSpecific_Settings defined following this comments block
	// Dynamic settings loads widget specific settings (based on the selection made in the dropdown) into the panel


	/**
	 * Widget Specific Settings contain the logic to load widget settings for the current selected widget type.
	 */
	var UwidgetSpecific_Settings = Upfront.Views.Editor.Settings.Item.extend({
		className: 'general_settings_item',

		get_title: function(){
			for(var i in Upfront.data.uwidget.widgets) {

				if(Upfront.data.uwidget.widgets[i].key === selected_widget || Upfront.data.uwidget.widgets[i].key === this.model.get_property_value_by_name('current_widget'))
					return Upfront.data.uwidget.widgets[i].name;
			}

			if(current_widget)
				return current_widget;
			else
				return '';
		},
		update_settings: function(widget, parent) {
			var self = this,
				data = {"action": "uwidget_get_widget_admin_form", "data": JSON.stringify({"widget": widget})}
			;
			Upfront.Util.post(data)
				.success(function (ret) {
					self.model.set_property('current_widget_specific_fields', ret.data);

					self.$el.html('');

					selected_widget = widget;
					current_widget = widget;

					self.udpate_fields();

					self.render();

					/** To enable for_view's re-rendering on widget selection from the drop down
						This is set after the widget specific settings are available to provide their
						parameters to the rendering of the widget **/
					parent.model.set_property('current_widget', widget);

				})
				.error(function (ret) {
					console.log("error receiving widget specific settings");
				})
			;
		},
		initialize: function() {
			selected_widget = current_widget;
			this.udpate_fields();
		},
		udpate_fields: function() {
			var self = this;
			this.fields=_([]);
			var specific_fields = this.model.get_property_value_by_name('current_widget_specific_fields') || this.model.get_property_value_by_name('widget_specific_fields');

			for( var key in specific_fields) {
				if(specific_fields[key]['type'] == 'select') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						label_style: 'inline',
						values: _.map(specific_fields[key]['options'], function(option, key){ return { label: option, value: key }; }),
						change: this.clear_cache,
						default_value: specific_fields[key]['value']

					});
				}
				else if(specific_fields[key]['type'] == 'text') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Text({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						label_style: 'inline',
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'textarea') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Textarea({
						model: this.model,
						property: specific_fields[key]['name'],
						label: specific_fields[key]['label'],
						label_style: 'inline',
						value: specific_fields[key]['value'],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'checkbox') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Toggle({
						model: this.model,
						property: specific_fields[key]['name'],
						label: '',
						multiple_field: true,
						default_value: "",
						label_style: 'inline',
						values: [{ label: specific_fields[key]['label'], value: 'yes' }],
						change: this.clear_cache
					});
				}
				else if(specific_fields[key]['type'] == 'radio') {
					this.fields._wrapped[this.fields._wrapped.length] = new Upfront.Views.Editor.Field.Radios({
						model: this.model,
						property: specific_fields[key]['name'],
						label_style: 'inline',
						label: '',
						values: [{ label: specific_fields[key]['label'], value: specific_fields[key]['value'] }],
						change: this.clear_cache
					});

				}
			}
		},
		clear_cache: function (value) {
			Upfront.data.uwidget.widgets_cache = {};
			var property = (this.options || {}).property,
				current = this.model.get_property_value_by_name('current_widget_specific_fields')
			;
			_.each(current, function (prop, idx) {
				if (property === (prop || {}).name) {
					this.model.set_property(property, value);
				}
			}, this);
		}
	});


	/**
	 * Widget settings to be returned. Contains logic to populate widget types dropdown list
	 * and triggers the instance dynamic_settings to re-render with new settings for the specific widget type selected.
	 */
	var UwidgetSettings = ElementSettings.extend({
		panels: {
			// only this one will be instantiated the API way
			Appearance: {
				mainDataCollection: 'widgetPresets',
				styleElementPrefix: 'widget-preset',
				ajaxActionSlug: 'widget',
				panelTitle: l10n.settings,
				presetDefaults: {
					'id': 'default',
					'name': l10n.default_preset
				},
				styleTpl: styleTpl,

				migrateDefaultStyle: function(styles) {
					//replace image wrapper class
					styles = styles.replace(/(div)?\.upfront-widget\s/g, '');
					styles = styles.replace(/(div)?\.upfront-object\s/g, '');

					return styles;
				}
			}
		},

		initialize: function (opts) {
			selected_widget = current_widget = false;
			// Call the super constructor here, so that the appearance panel is instantiated
			this.constructor.__super__.initialize.call(this, opts);

			var widget_values = _(_.filter(Upfront.data.uwidget.widgets, function (each) {
				return each.admin;
			})).map(function (each) {
				return { label: each.name, value: each.key };
			});

			// Add a default 'select' value
			widget_values.unshift({label: l10n.widget_select, value: ''});

			var panel = new RootSettingsPanel({
				model: this.model,
				className: 'upfront-settings_panel_wrap widget-settings',
				title: l10n.settings
			});

			var dynamic_settings = new UwidgetSpecific_Settings({model: this.model});

			var static_settings = new Upfront.Views.Editor.Settings.Item({
				model: this.model,
				title: l10n.widget_select,
				className: 'general_settings_item',
				fields: [
					new Upfront.Views.Editor.Field.Select({
						model: this.model,
						property: 'widget',
						values: widget_values,
						change: function(value) {

							current_widget = value;

							if( selected_widget !== value ) {
								//To load widget specific settings
								dynamic_settings.update_settings(value, this);

							}

						}
					})
				]
			});

			panel.settings = _([static_settings, dynamic_settings]);

			this.panels = _.extend({General: panel}, this.panels);


			// save widget specific fields when settings are saved, no one else will do that for you
			// clear previous subscription to events, that could be left over when 'saved' was cliked instead of 'cancel'
			var saveWidgetSpecificFields = function() {
				this.model.set_property('widget_specific_fields', this.model.get_property_value_by_name('current_widget_specific_fields'));
			};
			// clear previous subscription to events, that could be left over when 'cancelled' was cliked instead of 'save'
			Upfront.Events.off('element:settings:saved', saveWidgetSpecificFields);
			// then subscribe
			Upfront.Events.once('element:settings:saved', saveWidgetSpecificFields, this);

			// so, if settings are cancelled, all live rendering settings should revert
			var revertSettings = function() {
				current_widget = selected_widget = this.model.get_property_value_by_name('widget');
				this.model.set_property('current_widget_specific_fields', this.model.get_property_value_by_name('widget_specific_fields'), true);
				this.model.set_property('current_widget', this.model.get_property_value_by_name('widget'));
			};
			// clear previous subscription to events, that could be left over when 'saved' was cliked instead of 'cancel'
			Upfront.Events.off('element:settings:canceled', revertSettings);
			// then subscribe
			Upfront.Events.once('element:settings:canceled', revertSettings, this);


		},

		title: l10n.settings

	});

	// Generate presets styles to page
	Util.generatePresetsToPage('widget', styleTpl);
	return UwidgetSettings;
});
})(jQuery);
