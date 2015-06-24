(function ($) {
	define([
		'scripts/upfront/element-settings/panel'
	], function(ElementSettingsPanel) {
		var l10n = Upfront.Settings.l10n.text_element;

		var AppearancePanel = ElementSettingsPanel.extend({
		  className: 'plaintxt-settings-panel',
		  initialize: function (opts) {
				this.options = opts;
				var render_all,
				me = this;

				render_all = function(){
					this.settings.invoke('render');
				};

				_.bindAll(this, 'onBgColor', 'onBorderColor');

				this.settings = _([
					new Upfront.Views.Editor.Settings.Item({
						model: this.model,
						title: l10n.appearance,
						fields: [
							new Upfront.Views.Editor.Field.Radios({
								className: 'inline-radios  plaintext-settings',
								model: this.model,
								property: 'border_style',
								label: l10n.border,
								default_value: "none",
								values: [
									{ label: l10n.none, value: 'none' },
									{ label: l10n.solid, value: 'solid' },
									{ label: l10n.dashed, value: 'dashed' },
									{ label: l10n.dotted, value: 'dotted' }
								]
							}),
							new Upfront.Views.Editor.Field.Number({
								className: 'inline-number plaintext-settings',
								model: this.model,
								min: 1,
								property: 'border_width',
								label: l10n.width,
								default_value: 1,
								values: [
									{ label: "", value: '1' }
								]
							}),
							new Upfront.Views.Editor.Field.Color({
								className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color border-color',
								blank_alpha : 0,
								model: this.model,
								property: 'border_color',
								label: l10n.color,
								autoHide: false,
								spectrum: {
									preferredFormat: "hex",
									move: this.onBorderColor
								}
							}),
							new Upfront.Views.Editor.Field.Color({
								className: 'upfront-field-wrap upfront-field-wrap-color sp-cf  plaintext-settings inline-color bg-color',
								blank_alpha : 0,
								model: this.model,
								property: 'bg_color',
								label_style: 'inline',
								label: l10n.bg_color,
								autoHide: false,
								spectrum: {
									preferredFormat: "hex",
									move: this.onBgColor
								}
							})
						]
					})
				]);

				this.$el.on('change', 'input[name=border_style]', function(e){
				  me.onBorderStyle(e);
				});
				this.$el.on('change', 'input[name=border_width]', function(e){
				  me.onBorderWidth(e);
				});

			},
			onBgColor: function(color) {
				var c = color.get_is_theme_color() !== false ? color.theme_color : color.toRgbString();
				this.property('bg_color', c, false);
				this.processBg();
			},
			onBorderWidth: function(event) {
				this.property('border_width', $(event.currentTarget).val(), false);
				this.processBorder();
			},
			onBorderColor: function(color) {
				if( !color ) return;
				var c = color.get_is_theme_color() !== false ? color.theme_color : color.toRgbString();

				this.property('border_color',  c, true);
				this.processBorder();
			},
			onBorderStyle: function(event) {
				this.property('border_style', $(event.currentTarget).val(), false);
				this.processBorder();
			},
			processBg: function() {
				if(this.property('bg_color') == 'rgba(0, 0, 0, 0)')
				  this.property('background_color', '', false);
				else
				  this.property('background_color', this.property('bg_color'), false);
			},
			processBorder: function() {
				if(this.property('border_style') != 'none') {
					this.property('border', this.property('border_width')+'px '+this.property('border_color')+' '+this.property('border_style'), false);
					this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'inline-block');
				}
				else {
					this.property('border', '', false);
					this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'none');
				}
			},
			property: function(name, value, silent) {
				if(typeof value != "undefined") {
					if(typeof silent == "undefined")
						silent = true;

					return this.model.set_property(name, value, silent);
				}
				return this.model.get_property_value_by_name(name);
			},
			get_label: function () {
				return 'Appearance';
			},
			render: function() {
				// Render as usual
				this.constructor.__super__.render.apply(this, arguments);
				// Show border width if needed
				if(this.property('border_style') != 'none') {
					this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'inline-block');
				}
				else {
					this.$el.find('div.inline-color.plaintext-settings.border-color, div.inline-number.plaintext-settings').css('display', 'none');
				}
				// Remove panel tabs
				this.$el.find('.upfront-settings_label').remove();
				this.$el.find('.upfront-settings_panel').css('left', 0);

				//this.$(".sp-choose").on("click", function ( e ) {
				//  me.onBgColor(me.bgColor);
				//  me.onBorderColor(me.borderColor);
				//});
			}
		});

		return AppearancePanel;
	});
})(jQuery);
