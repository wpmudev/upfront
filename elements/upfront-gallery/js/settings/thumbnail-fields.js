define(function() {
	var l10n = Upfront.Settings.l10n.gallery_element;

	var ThumbnailFields = Upfront.Views.Editor.Settings.Item.extend({
		className: 'ugallery-thumbnail-fields',

		initialize: function(options) {
			var me = this,
				fields = Upfront.Views.Editor.Field;

			this.fields = _([
				new fields.Radios({
					model: this.model,
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

				new fields.Slider({
					model: this.model,
					property: 'thumbWidth',
					min: 100,
					max: 350,
					step: 5,
					label: l10n.thumb.size,
					// info: 'Slide to resize the thumbnails.',
					valueTextFilter: function(value){
						return '(' + value + 'px x ' + me.model.get_property_value_by_name('thumbHeight') + 'px)';
					}
				}),
				new fields.Hidden({
					model: this.model,
					property: 'thumbHeight'
				}),
				new fields.Slider({
					model: this.model,
					property: 'thumbPadding',
					min: 0,
					max: 50,
					step: 1,
					label: l10n.thumb.padding,
					valueTextFilter: function(value){
						return value + 'px';
					},
					callbacks: {
						slide: function(event, ui) {
							options.parent.updateProperty('thumbPadding', ui.value);
						}
					}
				}),
				new fields.Checkboxes({
					model: this.model,
					property: 'even_padding',
					values: [
						{
							value: 'true',
							label: l10n.panel.even_padding
						}
					],
					change: function(value) {
						options.parent.updateProperty(this.options.property, value);
					}
				})
			]);
		},
		get_title: function(){
			return l10n.thumb.settings;
		}
	});

	return ThumbnailFields;
});
