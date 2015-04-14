define([
	'elements/upfront-text/js/menulist'
], function(TextMenuList) {
	var l10n = Upfront.Settings.l10n.text_element;

	var TextMenu = Upfront.Views.ContextMenu.extend({
		initialize: function() {
			this.menulists = _([
				new TextMenuList()
			]);
		}
	});

	return TextMenu;
});
