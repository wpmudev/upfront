(function ($) {
define([
	'elements/upfront-newnavigation/js/menu-util'
], function(MenuUtil) {
	var l10n = Upfront.Settings.l10n.preset_manager;

	var MenuStructureModule = Backbone.View.extend({
		className: 'settings_module menu_structure_module clearfix',

		render: function() {
			this.$el.html('here be dragons');
		},

		save_fields: function() {
			console.log('here be saved fields');
		}
	});

	return MenuStructureModule;
});
})(jQuery);
