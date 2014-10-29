define([
	'elements/upfront-image/js/context-menu/list'
], function(ImageContextMenuList) {

	var ImageContextMenu = Upfront.Views.ContextMenu.extend({
		initialize: function(opts) {
			this.options = opts;
			this.for_view = this.options.for_view;
			this.menulists = _([
				new ImageContextMenuList({for_view: this.for_view})
			]);
		}
	});

	return ImageContextMenu;
});
