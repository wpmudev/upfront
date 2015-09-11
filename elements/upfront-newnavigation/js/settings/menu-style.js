define(function() {	
	var l10n = Upfront.Settings.l10n.newnavigation_element;
	
	var MenuStyle = Upfront.Views.Editor.Settings.Item.extend({
		className: 'settings_module menustyle_settings_item clearfix',
		group: true,
		get_title: function() {
			return this.options.title;
		},
		initialize: function(options) {
			this.options = options || {};
						
			var me = this,
				state = this.options.state;

			this.fields = _([
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module menu_style',
					name: 'menu_style',
					default_value: 'horizontal',
					label: l10n.mnu.style,
					values: [
						{ label: l10n.mnu.horiz, value: 'horizontal' },
						{ label: l10n.mnu.vert, value: 'vertical' },
						{ label: l10n.mnu.triggered, value: 'triggered' },
					],
					change: function(value) {
						me.model.set('menu_style', value);
					},
					show: function(value, $el) {
						console.log($el.find('.burger_alingment'));
						if(value === "triggered") {
							$el.parent().find('.burger_alingment').show();
						} else {
							$el.parent().find('.burger_alingment').hide();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module menu_alingment',
					name: 'menu_alingment',
					default_value: 'center',
					label: l10n.mnu.alingment,
					values: [
						{ label: l10n.mnu.left, value: 'left' },
						{ label: l10n.mnu.center, value: 'center' },
						{ label: l10n.mnu.right, value: 'right' },
					],
					change: function(value) {
						me.model.set('menu_alingment', value);
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module burger_alingment',
					name: 'burger_alignment',
					default_value: 'left',
					label: l10n.mnu.show_on_click,
					values: [
						{ label: l10n.mnu.left, value: 'left', icon: 'burger-left'},
						{ label: l10n.mnu.right, value: 'right', icon: 'burger-right'},
						{ label: l10n.mnu.top, value: 'top', icon: 'burger-top'},
						{ label: l10n.mnu.whole, value: 'whole', icon: 'burger-whole'}
					],
					change: function(value) {
						me.model.set('burger_alignment', value);
					}
				})
			]);
		},
	});

	return MenuStyle;
});