(function ($) {
define([
	'elements/upfront-image/js/settings/color-picker-field'
], function(ColorPickerField) {
	var l10n = Upfront.Settings.l10n.image_element;
	var DescriptionPanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'upfront-settings_panel_wrap uimage-settings',
		initialize: function (opts) {
			this.options = opts;
			var SettingsItem =  Upfront.Views.Editor.Settings.Item,
				Fields = Upfront.Views.Editor.Field
			;

			this.settings = _([
				new SettingsItem({

					title: l10n.settings.alt,
					fields: [
						new Fields.Text({
							className: 'image-alternative-text upfront-field-wrap upfront-field-wrap-text',
							hide_label: true,
							model: this.model,
							property: 'alternative_text',
							label: l10n.settings.alt
						})
					]
				}),

				new SettingsItem({
					title: l10n.settings.caption,
					fields: [
						new Fields.Radios({
							className: 'field-caption_trigger upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
							model: this.model,
							property: 'caption_trigger',
													label: l10n.settings.show_caption,
							layout: 'horizontal-inline',
							values: [
								{
									label: l10n.settings.always,
									value: 'always_show'
								},
								{
									label: l10n.settings.hover,
									value: 'hover_show'
								}
							]
						})
					]
				})
			]);

			if(this.model.get_property_value_by_name('include_image_caption')) {
				this.addCaptionBackgroundPicker();
			}
		},

		addCaptionBackgroundPicker: function(){
			var me = this,
				fields = Upfront.Views.Editor.Field
			;

			this.settings.push(new ColorPickerField({
				title: l10n.settings.caption_bg,
				fields: [
					new fields.Radios({
						model: this.model,
						property: 'captionBackground',
						layout: 'horizontal-inline',
						values: [
							{value: '0', label: l10n.settings.none},
							{value: '1', label: l10n.settings.pick}
						]
					})
				]
			}));

			this.on('rendered', function() {
				var spectrum = false,
					currentColor = me.model.get_property_value_by_name('background'),
					$picker_wrap = $('<span></span>'),
					setting = me.$('.ugallery-colorpicker-setting')
				;

				setting.find('.upfront-field-wrap').append($picker_wrap);
				setting.find('input[name="captionBackground"]').on('change', function(){
					me.toggleColorPicker();
				});
				var color_picker = new Upfront.Views.Editor.Field.Color({
					blank_alpha : 0,
					model: me.model,
					property: 'background',
					default_value: '#ffffff',
					spectrum: {
						maxSelectionSize: 9,
						localStorageKey: 'spectrum.recent_bgs',
						preferredFormat: 'hex',
						chooseText: l10n.settings.ok,
						showInput: true,
						allowEmpty:true,
						show: function(){
							spectrum = $('.sp-container:visible');
						},
						change: function(color) {
							var rgba = color.toRgbString();
							me.model.set_property('background', rgba, true);
							currentColor = rgba;
						},
						move: function(color) {
							var rgba = color.toRgbString();
							spectrum.find('.sp-dragger').css('border-top-color', rgba);
							spectrum.parent().find('.sp-dragger').css('border-right-color', rgba);
							me.parent_view.for_view.$el.find('.wp-caption').css('background-color', rgba);
						},
						hide: function(){
							me.parent_view.for_view.$el.find('.wp-caption').css('background-color', currentColor);
						}
					}
				});
				color_picker.render();
				$picker_wrap.html(color_picker.el);
				setting.find('.sp-replacer').css('display', 'inline-block');
				me.toggleColorPicker();
			});
		},
		toggleColorPicker: function(){
			var setting = this.$('.ugallery-colorpicker-setting'),
				color = setting.find('input:checked').val(),
				picker = setting.find('.sp-replacer')
			;
			if(color === '1'){
				picker.show();
				if(this.parent_view) {
					this.parent_view.for_view.$el.find('.wp-caption').css('background-color', this.model.get_property_value_by_name('background'));
				}
			} else {
				picker.hide();

				if(this.parent_view) {
					this.parent_view.for_view.$el.find('.wp-caption').css('background-color', 'transparent');
				}
			}
		},
		get_label: function () {
			return 'Settings';
		},
		get_title: function () {
			return false;
		}
	});

	return DescriptionPanel;
});
})(jQuery);
