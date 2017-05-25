define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.gallery_element;
	var CaptionLocation = BaseModule.extend({
		className: 'settings_module caption_location gallery-caption-location clearfix',
		group: false,

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;

			// Gallery caption toggle is always true
			this.options.toggle = true;

			this.fields = _([
				new Upfront.Views.Editor.Field.Toggle({
					model: this.model,
					className: 'useCaptions checkbox-title upfront-toggle-field',
					name: 'use_captions',
					label: '',
					default_value: 1,
					multiple: false,
					values: [
						{ label: l10n.panel.show_caption, value: 'yes' }
					],
					change: function(value) {
						me.model.set('use_captions', value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');
						//Toggle color fields
						if(value == "yes") {
							stateSettings.find('.' + state + '-toggle-wrapper').show();
							var height_type = me.model.get('caption-height', value);
							if(height_type === "fixed") {
								stateSettings.find('.'+ state +'-caption-height-number').show();
							}
						} else {
							stateSettings.find('.' + state + '-toggle-wrapper').hide();
							stateSettings.find('.'+ state +'-caption-height-number').hide();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-caption-select caption_select',
					name: 'captionType',
					default_value: 'below',
					label_style: 'inline',
					label: l10n.panel.caption_location,
					values: [
						{value: 'over', label: l10n.panel.over},
						{value: 'below', label: l10n.panel.under}
					],
					change: function(value) {
						me.model.set('captionType', value);

						//If caption below image, we should set captionOnHover to false
						if(value == "below") {
							me.model.set('showCaptionOnHover', '0');
						}
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_modules');
						if(value === "below" || typeof value === "undefined") {
							stateSettings.find('.gallery-caption-on-hover').hide();
						} else {
							stateSettings.find('.gallery-caption-on-hover').show();
						}
					}
				}),

				new Upfront.Views.Editor.Field.Radios_Inline({
					className: state + '-caption-trigger field-caption_trigger gallery-caption-on-hover upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios-inline over_image_field',
					model: this.model,
					name: 'showCaptionOnHover',
					label: l10n.panel.caption_show,
					label_style: 'inline',
					layout: 'horizontal-inline',
					values: [
						{
							label: l10n.panel.always,
							value: '0'
						},
						{
							label: l10n.panel.hover,
							value: '1'
						}
					],
					change: function(value) {
						me.model.set('showCaptionOnHover', value);
					}
				}),

				new Upfront.Views.Editor.Field.Radios_Inline({
					className: state + '-caption-height field-caption-height upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios-inline',
					model: this.model,
					name: 'caption-height',
					label_style: 'inline',
					label: l10n.panel.caption_height,
					layout: 'horizontal-inline',
					values: [
						{
							label: l10n.panel.auto,
							value: 'auto'
						},
						{
							label: l10n.panel.fixed,
							value: 'fixed'
						}
					],
					change: function(value) {
						me.model.set('caption-height', value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.state_modules');

						var use_captions = me.model.get('use_captions');
						if(use_captions === "yes") {
							//Toggle color fields
							if(value === "fixed") {
								stateSettings.find('.'+ state +'-caption-height-number').show();
							} else {
								stateSettings.find('.'+ state +'-caption-height-number').hide();
							}
						}
					}
				}),

				new Upfront.Views.Editor.Field.Number_Unit({
					model: this.model,
					className: state + '-caption-height-number caption-height-number',
					name: 'thumbCaptionsHeight',
					label_style: 'inline',
					min: 1,
					label: l10n.panel.caption_height,
					default_value: 20,
					values: [
						{ label: 'px', value: '1' }
					],
					change: function(value) {
						me.model.set('thumbCaptionsHeight', value);
					}
				})
			]);

			this.listenToOnce(this, 'rendered', function() {
				setTimeout( function() {
					if(me.model.get('use_captions') === 'yes') {
						me.$el.find('.' + state + '-toggle-wrapper').show();
						var height_type = me.model.get('caption-height', value);
						if(height_type === "fixed") {
							me.$el.find('.'+ state +'-caption-height-number').show();
						}
					} else {
						me.$el.find('.' + state + '-toggle-wrapper').hide();
						me.$el.find('.'+ state +'-caption-height-number').hide();
					}
				}, 500);
			});
		}
	});

	return CaptionLocation;
});
