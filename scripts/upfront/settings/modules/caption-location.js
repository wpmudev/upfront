define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.image_element;
	var CaptionLocationSettingsModule = BaseModule.extend({
		className: 'settings_module image-caption-location caption_location clearfix',
		group: false,

		initialize: function(options) {
			this.options = options || {};
			var me = this,
				state = this.options.state;

			// Caption toggle is always true
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
						{ label: l10n.settings.show_caption, value: 'yes' }
					],
					change: function(value) {
						me.model.set('use_captions', value);
					},
					show: function(value, $el) {
						var stateSettings = $el.closest('.upfront-settings-item-content');
						//Toggle color fields
						if(value == "yes") {
							stateSettings.find('.' + state + '-toggle-wrapper').show();
						} else {
							stateSettings.find('.' + state + '-toggle-wrapper').hide();
						}
					}
				}),

				new Upfront.Views.Editor.Field.Radios({
					className: state + '-caption-trigger field-caption_trigger upfront-field-wrap upfront-field-wrap-multiple upfront-field-wrap-radios over_image_field',
					model: this.model,
					name: 'caption-trigger',
					label: '',
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
					],
					change: function(value) {
						me.model.set('caption-trigger', value);
					},
					init: function(){
						me.listenTo(this.model, "change", me.render);
					},
					rendered: function(){
						_.delay(this.options.disable_hover_show, 200);
					},
					disable_hover_show: function(){
						me.$el.find("[value='hover_show']").attr("disabled", false);
						if( 'below_image' ===  me.model.get("caption-position") )
							me.$el.find("[value='hover_show']").attr("disabled", true);

					}
				}),

				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-caption-select caption_select',
					name: 'caption-position-value',
					default_value: 'topOver',
					label: l10n.ctrl.caption_position,
					values: [
						{ label: l10n.ctrl.over_top, value: 'topOver', icon: 'topOver' },
						{ label: l10n.ctrl.over_bottom, value: 'bottomOver', icon: 'bottomOver' },
						{ label: l10n.ctrl.cover_top, value: 'topCover', icon: 'topCover' },
						{ label: l10n.ctrl.cover_middle, value: 'middleCover', icon: 'middleCover' },
						{ label: l10n.ctrl.cover_bottom, value: 'bottomCover', icon: 'bottomCover' },
						{ label: l10n.ctrl.below, value: 'below', icon: 'below' }
					],
					change: function(value) {
						me.model.set('caption-position-value', value);
						switch(value){
							case 'topOver':
								me.model.set('caption-position', 'over_image');
								me.model.set('caption-alignment', 'top');
								break;
							case 'bottomOver':
								me.model.set('caption-position', 'over_image');
								me.model.set('caption-alignment', 'bottom');
								break;
							case 'topCover':
								me.model.set('caption-position', 'over_image');
								me.model.set('caption-alignment', 'fill');
								break;
							case 'middleCover':
								me.model.set('caption-position', 'over_image');
								me.model.set('caption-alignment', 'fill_middle');
								break;
							case 'bottomCover':
								me.model.set('caption-position', 'over_image');
								me.model.set('caption-alignment', 'fill_bottom');
								break;
							case 'below':
								me.model.set('caption-position', 'below_image');
								me.model.set('caption-alignment', false);
								me.model.set('caption-trigger', "always_show");
						}
					}
				})
			]);
		}
	});

	return CaptionLocationSettingsModule;
});
