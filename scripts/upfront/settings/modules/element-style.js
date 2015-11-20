define([
	'scripts/upfront/settings/modules/base-module'
], function(BaseModule) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var ElementStyleModule = BaseModule.extend({
		className: "upfront-settings-item-anchor",

		initialize: function (opts) {
			this.options = opts;
			var me = this;
			var displayStyle = new Upfront.Views.Editor.Field.Text({
				model: this.model,
				property: 'theme_style',
				label: 'Element style:'
			});

			var openEditor = new Upfront.Views.Editor.Field.Button({
				label: 'Show style',
				compact: true,
				on_click: function(){
					me.openCssEditor();
				},
				display: 'inline'
			});

			var removeStyle = new Upfront.Views.Editor.Field.Button({
				label: 'Remove style',
				compact: true,
				on_click: function(){
					me.removeStyle();
				},
				display: 'inline'
			});

			this.listenTo(displayStyle, 'rendered', function() {
				displayStyle.$el.find('input').attr('readonly', 'readonly');
			});

			this.fields = _([
				displayStyle,
				openEditor,
				removeStyle
			]);

			this.on('panel:set', function(){
				me.fields.each(function(field){
					field.panel = me.panel;
					field.trigger('panel:set');
				});
			});
		},

		openCssEditor: function() {
			var elementStyleName = this.model.get_property_value_by_name('theme_style');

			Upfront.Application.cssEditor.init({
				model: this.model,
				stylename: elementStyleName,
				sidebar: false,
				toolbar: false,
				readOnly: true
			});
		},

		removeStyle: function() {
			this.$el.find('input[type=text]').val('');
			this.$el.hide();
			this.model.set_property('theme_style', '');
		}
	});

	return ElementStyleModule;
});
