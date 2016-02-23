(function ($) {
define([
	'scripts/upfront/behaviors/layout-editor',
	'scripts/upfront/behaviors/grid-editor'
], function (LayoutEditor, GridEditor) {
	return {
		Behaviors: {
			LayoutEditor: LayoutEditor,
			GridEditor: GridEditor
		}
	};
});

})(jQuery);
//@ sourceURL=upfront-behavior.js
