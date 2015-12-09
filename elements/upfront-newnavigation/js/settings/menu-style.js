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
					default_value: this.model.get('menu_style'),
					label: l10n.mnu.style,
					values: [
						{ label: l10n.mnu.horiz, value: 'horizontal' },
						{ label: l10n.mnu.vert, value: 'vertical' },
						{ label: l10n.mnu.burger, value: 'burger' }, // this is actually 'burger' style
					],
					change: function(value) {
						me.model.set('menu_style', value);
						if (value !== 'burger') {
							me.fields._wrapped[3].$el.hide();
							me.fields._wrapped[3].set_value('over');
						} else if (me.model.get('burger_alignment') === 'top') {
							me.fields._wrapped[3].$el.show();
						}
					},
					show: function(value, $el) {
						if(value === "burger") {
							$el.parent().find('.burger_alingment').show();
						} else {
							$el.parent().find('.burger_alingment').hide();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module menu_alingment',
					name: 'menu_alignment',
					default_value: this.model.get('menu_alignment'),
					label: l10n.mnu.alignment,
					values: [
						{ label: l10n.mnu.left, value: 'left' },
						{ label: l10n.mnu.center, value: 'center' },
						{ label: l10n.mnu.right, value: 'right' },
					],
					change: function(value) {
						me.model.set('menu_alignment', value);
					}
				}),
				new Upfront.Views.Editor.Field.Select({
					model: this.model,
					className: state + '-select select-module burger_alingment',
					name: 'burger_alignment',
					default_value: this.model.get('burger_alignment'),
					label: l10n.mnu.show_on_click,
					values: [
						{ label: l10n.mnu.left, value: 'left', icon: 'burger-left'},
						{ label: l10n.mnu.right, value: 'right', icon: 'burger-right'},
						{ label: l10n.mnu.top, value: 'top', icon: 'burger-top'},
						{ label: l10n.mnu.whole, value: 'whole', icon: 'burger-whole'}
					],
					change: function(value) {
						me.model.set('burger_alignment', value);
						if(value === 'left' || value === 'right' || value === 'whole') {
							me.fields._wrapped[3].$el.hide();
							me.fields._wrapped[3].set_value('over');
						}
						else {
							me.fields._wrapped[3].$el.show();
						}
					}
				}),
				new Upfront.Views.Editor.Field.Radios({
					model: this.model,
					default_value: this.model.get('burger_over'),
					name: 'burger_over',
					label: "",
					layout: "vertical",
					values: [
						{ label: l10n.mnu.over, value: 'over' },
						{ label: l10n.mnu.push, value: 'pushes' }
					],
					change: function(value) {
						me.model.set('burger_over', value);
					}
				})
			]);
			this.listenTo(this, 'rendered', function() {
				var alignment = me.model.get('burger_alignment');
				if(alignment === 'left' || alignment === 'right' || alignment === 'whole') {
					me.fields._wrapped[3].$el.hide();
					me.fields._wrapped[3].set_value('over');
				}
				else {
					me.fields._wrapped[3].$el.show();
				}
				var style = me.model.get('menu_style');
				if (style !== 'burger') {
					me.fields._wrapped[3].$el.hide();
					me.fields._wrapped[3].set_value('over');
				}
			});
		},
	});

	return MenuStyle;
});
