define([
	'scripts/upfront/element-settings/panel'
], function(ElementSettingsPanel) {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var ThumbnailFields = ElementSettingsPanel.extend({
		className: 'ugallery-thumbnail-fields',
		initialize: function(opts) {
			this.options = opts;
			var me = this,
				SettingsItem =  Upfront.Views.Editor.Settings.Item,
				fields = Upfront.Views.Editor.Field;

			this.settings = _([
				new SettingsItem({
					className: 'general_settings_item',
					title: l10n.thumb.thumb_settings,
					fields: [
						new fields.Select({
							model: this.model,
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
							]
						}),
					]
				}),
				new SettingsItem({
					className: 'general_settings_item',
					title: l10n.thumb.size,
					fields: [	
						new fields.Slider({
							model: this.model,
							property: 'thumbWidth',
							className: 'thumb-size-slider',
							min: 100,
							max: 250,
							step: 5,
							label: l10n.thumb.size
						}),
						
						new Upfront.Views.Editor.Field.Number({
							model: this.model,
							className: 'thumb-size-number',
							property: 'thumbWidthNumber',
							default_value: 0,
							change: function(value) {

								me.model.set_property('thumbWidthNumber', value);
								
								//Update slider value
								s = me.settings._wrapped[1].fields._wrapped[0];
								s.$el.find('#'+s.get_field_id()).slider('value', value);
								s.get_field().val(value);
								s.trigger('changed');
								
								//Lower opacity if value is bigger than the slider MAX_VALUE
								if(value > 50) {
									me.$el.find('.thumb-size-slider').css('opacity', 0.6);
								} else {
									me.$el.find('.thumb-size-slider').css('opacity', 1);
								} 
							}
						}),	
						new fields.Hidden({
							model: this.model,
							property: 'thumbHeight'
						}),
					]
				}),
				new SettingsItem({
					className: 'general_settings_item',
					title: l10n.thumb.spacing,
					fields: [	
						new fields.Checkboxes({
							model: this.model,
							className: 'gallery-padding-lock',
							property: 'lockPadding',
							label: "",
							default_value: 0,
							multiple: false,
							values: [
								{ label: '', value: 'yes' }
							],
							show: function(value) {
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
						}),
						
						new fields.Slider({
							model: this.model,
							property: 'thumbPadding',
							className: 'thumb-padding-slider',
							min: 0,
							max: 50,
							step: 1,
							label: l10n.thumb.spacing,
							valueTextFilter: function(value){
								return value + 'px';
							},
							change: function(value) {
								me.model.set_property('thumbPadding', value);
								me.model.set_property('thumbPaddingNumber', value);
							}
						}),
						
						new Upfront.Views.Editor.Field.Number({
							model: this.model,
							className: 'thumb-padding-number',
							property: 'thumbPaddingNumber',
							default_value: 0,
							change: function(value) {
								me.model.set_property('thumbPaddingNumber', value);
								
								//Update slider value
								s = me.settings._wrapped[2].fields._wrapped[1];
								s.$el.find('#'+s.get_field_id()).slider('value', value);
								s.get_field().val(value);
								s.trigger('changed');
								
								//Lower opacity if value is bigger than the slider MAX_VALUE
								if(value > 50) {
									me.$el.find('.thumb-padding-slider').css('opacity', 0.6);
								} else {
									me.$el.find('.thumb-padding-slider').css('opacity', 1);
								} 
							}
						}),	
						
						new fields.Slider({
							model: this.model,
							property: 'sidePadding',
							className: 'thumb-side-padding-slider',
							min: 0,
							max: 50,
							step: 1,
							label: l10n.thumb.side_spacing,
						}),
						
						new Upfront.Views.Editor.Field.Number({
							model: this.model,
							className: 'thumb-side-padding-number',
							property: 'thumbSidePaddingNumber',
							default_value: 0,
							change: function(value) {
								me.model.set_property('sidePaddingNumber', value);
								
								//Update slider value
								s = me.settings._wrapped[2].fields._wrapped[3];
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
						}),	
						
						new fields.Slider({
							model: this.model,
							property: 'bottomPadding',
							className: 'thumb-bottom-padding-slider',
							min: 0,
							max: 50,
							step: 1,
							label: l10n.thumb.bottom_spacing,
						}),
						
						new Upfront.Views.Editor.Field.Number({
							model: this.model,
							className: 'thumb-bottom-padding-number',
							property: 'thumbBottomPaddingNumber',
							default_value: 0,
							change: function(value) {
								me.model.set_property('bottomPaddingNumber', value);
								
								//Update slider value
								s = me.settings._wrapped[2].fields._wrapped[5];
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
						}),	
					]
				})
			]);	
		},
		get_title: function(){
			return l10n.thumb.settings;
		}
	});

	return ThumbnailFields;
});
