/*
* Field names properies
* `use` - Toggle border settings
* `width` - Border width
* `type` - Border type
* `color` - Border color
*/
define(function() {	
	var l10n = Upfront.Settings.l10n.button_element;
	var BorderSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'border_settings_item clearfix',
		group: true,

		get_title: function() {
			return this.options.title;
		},

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useBorder',
					name: me.options.fields.use,
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.border, value: 'yes' }
					],
					change: function(value) {
						me.model.set(me.options.fields.use, value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_settings');

						//Toggle border settings when depending on checkbox value
						if(value == "yes") {
							stateSettings.find('.' + state + '-border-width').show();
							stateSettings.find('.' + state + '-border-type').show();
							stateSettings.find('.' + state + '-border-color').show();
						} else {
							stateSettings.find('.' + state + '-border-width').hide();
							stateSettings.find('.' + state + '-border-type').hide();
							stateSettings.find('.' + state + '-border-color').hide();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-border-width borderWidth',
					name: me.options.fields.width,
					label: '',
					default_value: 1,
					suffix: l10n.px,
					values: [
						{ label: "", value: '1' }
					],
					change: function(value) {
						me.model.set(me.options.fields.width, value);
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-border-type borderType',
					name: me.options.fields.type,
					default_value: "solid",
					label: '',
					values: [
						{ label: l10n.solid, value: 'solid' },
						{ label: l10n.dashed, value: 'dashed' },
						{ label: l10n.dotted, value: 'dotted' }
					],
					change: function(value) {
						me.model.set(me.options.fields.type, value);
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: state + '-border-color upfront-field-wrap upfront-field-wrap-color sp-cf borderColor',
					name: me.options.fields.color,
					blank_alpha : 0,
					label: '',
					default_value: '#000',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.options.fields.color, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(me.options.fields.color, c);
						}
					}
				}),
			]);
		}
	});

	return BorderSettingsItem;
});