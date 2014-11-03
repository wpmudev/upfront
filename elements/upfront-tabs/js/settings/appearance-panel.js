(function ($) {
define(function() {
	var AppearancePanel = Upfront.Views.Editor.Settings.Panel.extend({
		className: 'utabs-settings-panel',
		initialize: function (opts) {
	this.options = opts;
			var render_all,
				me = this;

			render_all = function(){
				this.settings.invoke('render');
			};
			_.bindAll(this, 'onActiveTabColorChange', 'onInactiveTabColorChange', 'onActiveTabTextColorChange', 'onInactiveTabTextColorChange');

			this.model.on('doit', render_all, this);

			this.settings = _([
				new Upfront.Views.Editor.Settings.Item({
					model: this.model,
					title: 'Display style',
					fields: [
						new Upfront.Views.Editor.Field.Select({
							model: this.model,
							property: 'theme_style',
							label: 'Theme Styles',
							values: [
								{ label: 'Tabbed', value: 'tabbed' },
								{ label: 'Simple text', value: 'simple_text' },
								{ label: 'Button Tabs', value: 'button_tabs' }
							]
						})
					]
				})
			]);

			this.$el .on('change', 'input[name=style_type]', function(e){
				me.onStyleTypeChange(e);
			});
			this.$el .on('change', 'input[name=theme_style]', function(e){
				me.onThemeStyleChange(e);
			});
			this.$el .on('change', 'input[name=custom_style]', function(e){
				me.onCustomStyleChange(e);
			});
		},

		onStyleTypeChange: function(event) {
			this.property('style_type', $(event.currentTarget).val(), false);
			this.setColorChooserVisibility();
		},

		onCustomStyleChange: function(event) {
			this.property('custom_style', $(event.currentTarget).val(), false);
			this.setColorChooserVisibility();
		},

		onThemeStyleChange: function(event) {
			this.property('theme_style', $(event.currentTarget).val(), false);
		},

		onActiveTabColorChange: function(event) {
			this.property('active_tab_color', event.toHslString(), false);
		},

		onActiveTabTextColorChange: function(event) {
			this.property('active_tab_text_color', event.toHslString(), false);
		},

		onInactiveTabColorChange: function(event) {
			this.property('inactive_tab_color', event.toHslString(), false);
		},

		onInactiveTabTextColorChange: function(event) {
			this.property('inactive_tab_text_color', event.toHslString(), false);
		},

		setColorChooserVisibility: function() {
			// Use visibility so that settings box will not resize.
			$('.upfront-field-wrap-color').css('visibility', 'hidden');

			if (this.property('style_type') === 'theme_defined') {
				return;
			}

			if (this.property('custom_style') === 'simple_text') {
				$('.text-color').css('visibility', 'visible');
				return;
			}

			$('.upfront-field-wrap-color').css('visibility', 'visible');
		},

		get_label: function () {
			return 'Appearance';
		},

		get_title: function () {
			return false;
		},

		property: function(name, value, silent) {
			if(typeof value !== 'undefined'){
				if(typeof silent === 'undefined') {
					silent = true;
				}
				return this.model.set_property(name, value, silent);
			}
			return this.model.get_property_value_by_name(name);
		},

		render: function() {
			AppearancePanel.__super__.render.apply(this, arguments);
			_.delay(function(self) {
				self.setColorChooserVisibility();
			}, 1, this);
		}
	});

	return AppearancePanel;
});
})(jQuery);
