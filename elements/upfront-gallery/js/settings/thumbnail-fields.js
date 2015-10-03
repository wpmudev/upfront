define([
	'scripts/upfront/element-settings/root-settings-panel'
], function(RootSettingsPanel) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var ThumbnailFields = RootSettingsPanel.extend({
		className: 'ugallery-thumbnail-fields upfront-settings_panel',
		settings: [
			{
				type: 'SettingsItem',
				className: 'general_settings_item',
				title: l10n.thumb.thumb_settings,
				fields: [
					{
						type: 'Select',
						className: 'thumb-propostions',
						property: 'thumbProportions',
						label: l10n.thumb.ratio,
						layout: 'vertical',
						values: [
							{
								label: l10n.thumb.theme,
								value: 'theme',
								icon: 'gallery-crop-theme'
							},
							{
								label: '1:1',
								value: '1',
								icon: 'gallery-crop-1_1'
							},
							{
								label: '2:3',
								value: '0.66',
								icon: 'gallery-crop-2_3'
							},
							{
								label: '4:3',
								value: '1.33',
								icon: 'gallery-crop-4_3'
							}
						],
						change: function(value, me) {
							me.model.set_property('thumbProportions', value);
						}
					}
				]
			},
			{
				type: 'SettingsItem',
				className: 'general_settings_item',
				title: l10n.thumb.size,
				fields: [
					{
						type: 'Slider',
						property: 'thumbWidth',
						className: 'thumb-size-slider',
						min: 100,
						max: 250,
						step: 5,
						label: l10n.thumb.size,
						change: function(value, me) {
							var f = me.settings._wrapped[1].fields._wrapped[1];
							f.get_field().val(value);
						}
					},
					{
						type: 'Number',
						className: 'thumb-size-number',
						property: 'thumbWidthNumber',
						default_value: 0,
						min: 100,
						max: 250,
						change: function(value, me) {
							//Update slider value
							var s = me.settings._wrapped[1].fields._wrapped[0];
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');

							//Update slider number value
							var f = me.settings._wrapped[1].fields._wrapped[1];
							f.get_field().val(value);

							// Lower opacity if value is bigger than the slider MAX_VALUE
							if(value > 250) {
								me.$el.find('.thumb-size-slider').css('opacity', 0.6);
							} else {
								me.$el.find('.thumb-size-slider').css('opacity', 1);
							}
						}
					},
					{
						type: 'Hidden',
						property: 'thumbHeight'
					}
				]
			},
			{
				type: 'SettingsItem',
				className: 'general_settings_item',
				title: l10n.thumb.spacing,
				fields: [
					{
						type: 'Checkboxes',
						className: 'gallery-padding-lock',
						property: 'lockPadding',
						label: "",
						default_value: 0,
						multiple: false,
						values: [
							{ label: '', value: 'yes' }
						],
						change: function(value, me) {
							me.model.set_property('lockPadding', value);
						},
						show: function(value, me) {
							//Toggle border radius fields
							if(value == "yes") {
								me.$el.find('.thumb-padding-slider').show();
								me.$el.find('.thumb-padding-number').show();
								me.$el.find('.thumb-side-padding-slider').hide();
								me.$el.find('.thumb-side-padding-number').hide();
								me.$el.find('.thumb-bottom-padding-slider').hide();
								me.$el.find('.thumb-bottom-padding-number').hide();
							} else {
								me.$el.find('.thumb-padding-slider').hide();
								me.$el.find('.thumb-padding-number').hide();
								me.$el.find('.thumb-side-padding-slider').show();
								me.$el.find('.thumb-side-padding-number').show();
								me.$el.find('.thumb-bottom-padding-slider').show();
								me.$el.find('.thumb-bottom-padding-number').show();
							}
						}
					},
					{
						type: 'Slider',
						property: 'thumbPadding',
						className: 'thumb-padding-slider',
						min: 0,
						max: 50,
						step: 1,
						label: l10n.thumb.spacing,
						valueTextFilter: function(value){
							return value + 'px';
						},
						change: function(value, me) {
							var f = me.settings._wrapped[2].fields._wrapped[2];
							f.get_field().val(value);
						}
					},
					{
						type: 'Number',
						className: 'thumb-padding-number',
						property: 'thumbPaddingNumber',
						default_value: 0,
						change: function(value, me) {
							//Update slider value
							var s = me.settings._wrapped[2].fields._wrapped[1];
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');

							var f = me.settings._wrapped[2].fields._wrapped[2];
							f.get_field().val(value);

							//Lower opacity if value is bigger than the slider MAX_VALUE
							if(value > 50) {
								me.$el.find('.thumb-padding-slider').css('opacity', 0.6);
							} else {
								me.$el.find('.thumb-padding-slider').css('opacity', 1);
							}
						}
					},
					{
						type: 'Slider',
						property: 'sidePadding',
						className: 'thumb-side-padding-slider',
						min: 0,
						max: 50,
						step: 1,
						label: l10n.thumb.side_spacing,
						change: function(value, me) {
							var f = me.settings._wrapped[2].fields._wrapped[4];
							f.get_field().val(value);
						}
					},
					{
						type: 'Number',
						className: 'thumb-side-padding-number',
						property: 'thumbSidePaddingNumber',
						default_value: 0,
						change: function(value, me) {
							var f = me.settings._wrapped[2].fields._wrapped[4];
							f.get_field().val(value);

							//Update slider value
							var s = me.settings._wrapped[2].fields._wrapped[3];
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');

							//Lower opacity if value is bigger than the slider MAX_VALUE
							if(value > 50) {
								me.$el.find('.thumb-side-padding-slider').css('opacity', 0.6);
							} else {
								me.$el.find('.thumb-side-padding-slider').css('opacity', 1);
							}
						}
					},
					{
						type: 'Slider',
						property: 'bottomPadding',
						className: 'thumb-bottom-padding-slider',
						min: 0,
						max: 50,
						step: 1,
						label: l10n.thumb.bottom_spacing,
						change: function(value, me) {
							var f = me.settings._wrapped[2].fields._wrapped[6];
							f.get_field().val(value);
						}
					},
					{
						type: 'Number',
						className: 'thumb-bottom-padding-number',
						property: 'thumbBottomPaddingNumber',
						default_value: 0,
						change: function(value, me) {
							var f = me.settings._wrapped[2].fields._wrapped[6];
							f.get_field().val(value);

							//Update slider value
							var s = me.settings._wrapped[2].fields._wrapped[5];
							s.$el.find('#'+s.get_field_id()).slider('value', value);
							s.get_field().val(value);
							s.trigger('changed');

							//Lower opacity if value is bigger than the slider MAX_VALUE
							if(value > 50) {
								me.$el.find('.thumb-bottom-padding-slider').css('opacity', 0.6);
							} else {
								me.$el.find('.thumb-bottom-padding-slider').css('opacity', 1);
							}
						}
					}
				]
			}
		],
		title: 'General Settings'
	});

	return ThumbnailFields;
});
