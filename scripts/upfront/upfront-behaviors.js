(function ($) {
define([
	'scripts/upfront/behaviors/layout-editor',
	'scripts/upfront/behaviors/grid-editor',
	'scripts/upfront/behaviors/shortcuts'
], function (LayoutEditor, GridEditor, Shortcuts) {
	Shortcuts.init();

	return {
		Behaviors: {
			LayoutEditor: LayoutEditor,
			GridEditor: GridEditor
		}
	};
});

})(jQuery);
//# sourceURL=upfront-behavior.js
