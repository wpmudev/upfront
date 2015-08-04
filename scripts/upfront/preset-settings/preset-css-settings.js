define([
	'scripts/upfront/preset-settings/preset-css-editor'
], function(PresetCSSEditor) {
	var l10n = Upfront.Settings.l10n.preset_manager;
	var PresetCSS = Upfront.Views.Editor.Settings.Item.extend({
		className: 'upfront-settings-css',
		events: {
			'click input[name=preset_css]': 'openEditor'
		},
		initialize: function(options) {
			var me = this;
							
			Upfront.Views.Editor.Settings.Item.prototype.initialize.call(this, options);

			this.fields = _([
				new Upfront.Views.Editor.Field.Button({
					model: me.model,
					className: 'edit_preset_css',
					compact: true,
					name: 'preset_css',
					label: l10n.edit_preset_css,
				})
			]);
		},
		
		onPresetUpdate: function(preset) {
			this.trigger('upfront:presets:update', preset);
		},
		
		openEditor: function(e){
			e.preventDefault();

			Upfront.Events.trigger("entity:settings:beforedeactivate");
			
			var styleType = Upfront.Application.cssEditor.getElementType(this.model);
			var styleName = styleType.label.toLowerCase() + '-preset-' + this.options.preset.get('id');
			
			this.presetCSSEditor = new PresetCSSEditor({
				model: this.model,
				preset: this.options.preset,
				stylename: styleName
			});
			
			this.listenTo(this.presetCSSEditor, 'upfront:presets:update', this.onPresetUpdate);			
			
			Upfront.Events.trigger("entity:settings:deactivate");

			//$('#settings').find('.upfront-save_settings').click();
		}
	});


	return PresetCSS;
});

