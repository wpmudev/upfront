/*
* Field names properies
* `use` - Toggle border settings
* `width` - Border width
* `type` - Border type
* `color` - Border color
*/
define(function() {	
	var l10n = Upfront.Settings.l10n.preset_manager;
	var BorderSettingsItem = Upfront.Views.Editor.Settings.Item.extend({
		className: 'settings_module border_settings_item clearfix',
		group: false,
		
		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state,
				fieldCounter = 0,
				custom_class = '',
				current_element = '';
			
			//If fields added increase field counter
			if(typeof this.options.elements !== "undefined") {
				fieldCounter++;
			}
			
			//Set default element
			if(typeof this.options.default_element !== "undefined") {
				current_element = this.options.default_element + '-';
				custom_class = 'border-with-fields';
			}
			
			this.fields = _([
				new Upfront.Views.Editor.Field.Checkboxes({
					model: this.model,
					className: 'useBorder checkbox-title',
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
						var stateSettings = $el.closest('.state_modules');
						
						//Toggle border settings when depending on checkbox value
						if(value == "yes") {
							stateSettings.find('.' + state + '-border-width').show();
							stateSettings.find('.' + state + '-border-type').show();
							stateSettings.find('.' + state + '-border-color').show();
							stateSettings.find('.' + state + '-border-select-element').css("opacity", "1");
						} else {
							stateSettings.find('.' + state + '-border-width').hide();
							stateSettings.find('.' + state + '-border-type').hide();
							stateSettings.find('.' + state + '-border-color').hide();
							stateSettings.find('.' + state + '-border-select-element').css("opacity", "0.5");
						}
					}
				}),
				new Upfront.Views.Editor.Field.Number({
					model: this.model,
					className: state + '-border-width borderWidth ' + custom_class,
					name: current_element + me.options.fields.width,
					label: '',
					default_value: 1,
					suffix: l10n.px,
					values: [
						{ label: "", value: '1' }
					],
					change: function(value) {
						me.model.set(current_element + me.options.fields.width, value);
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-border-type borderType ' + custom_class,
					name: current_element + me.options.fields.type,
					default_value: "solid",
					label: '',
					values: [
						{ label: l10n.solid, value: 'solid' },
						{ label: l10n.dashed, value: 'dashed' },
						{ label: l10n.dotted, value: 'dotted' }
					],
					change: function(value) {
						me.model.set(current_element + me.options.fields.type, value);
					}
				}),
				
				new Upfront.Views.Editor.Field.Color({
					model: this.model,
					className: state + '-border-color upfront-field-wrap upfront-field-wrap-color sp-cf borderColor ' + custom_class,
					name: current_element + me.options.fields.color,
					blank_alpha : 0,
					label: '',
					default_value: '#000',
					spectrum: {
						preferredFormat: 'rgb',
						change: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(current_element + me.options.fields.color, c);
						},
						move: function(value) {
							if (!value) return false;
							var c = value.get_is_theme_color() !== false ? value.theme_color : value.toRgbString();
							me.model.set(current_element + me.options.fields.color, c);
						}
					}
				})
			]);
			
			//Add fields select box
			if(typeof me.options.elements !== "undefined") {
				this.fields.unshift(
					new Upfront.Views.Editor.Field.Select({
						className: state + '-border-select-element border_selectElement',
						values: me.options.elements,
						change: function () {
							var value = this.get_value();
							current_element = value + '-';
							me.fields._wrapped[fieldCounter + 1].set_value(me.model.get(current_element + me.options.fields.width));
							me.fields._wrapped[fieldCounter + 2].set_value(me.model.get(current_element + me.options.fields.type));
							me.fields._wrapped[fieldCounter + 3].set_value(me.model.get(current_element + me.options.fields.color));
							me.fields._wrapped[fieldCounter + 3].update_input_border_color(me.model.get(current_element + me.options.fields.color));
						}
					})
				);	
			}
		},
	});

	return BorderSettingsItem;
});