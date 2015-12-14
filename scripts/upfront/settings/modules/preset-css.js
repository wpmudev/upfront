define([
	'scripts/upfront/settings/modules/base-module',
	'scripts/upfront/preset-settings/preset-css-editor'
], function(BaseModule, PresetCSSEditor) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var PresetCssModule = BaseModule.extend({
		className: 'upfront-settings-css',
		events: {
			'click input[name=preset_css]': 'openEditor'
		},
		initialize: function(options) {
			var me = this;

			BaseModule.prototype.initialize.call(this, options);

			this.fields = _([
				new Upfront.Views.Editor.Field.Button({
					model: me.model,
					className: 'edit_preset_label',
					compact: true,
					label: l10n.edit_preset_label,
				}),

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

		updateCss: function(preset, newCss) {
			preset.set({'preset_style': newCss});
		},

		openEditor: function(e){
			var me = this;
			e.preventDefault();

			Upfront.Events.trigger("entity:settings:beforedeactivate");

			var styleType = Upfront.Application.cssEditor.getElementType(this.model);
			var styleName = styleType.label.toLowerCase() + '-preset-' + this.options.preset.get('id');

			this.presetCSSEditor = new PresetCSSEditor({
				model: this.model,
				preset: this.options.preset,
				stylename: styleName
			});

			var updateCssDebounced = _.debounce(this.updateCss, 1000);

			this.listenTo(this.presetCSSEditor, 'upfront:presets:update', this.onPresetUpdate);
			this.listenTo(this.presetCSSEditor, 'change', function(newCss) {
				updateCssDebounced(me.options.preset, newCss);
			});

			Upfront.Events.trigger("entity:settings:deactivate");
		}
	});


	return PresetCssModule;
});

