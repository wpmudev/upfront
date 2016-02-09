;(function ($, undefined) {
define([], function() {
	var l10n = Upfront.Settings.l10n.text_element;

	var TextMenuList = Upfront.Views.ContextMenuList.extend({
			initialize: function() {
				var me = this;
				this.menuitems = _([
					new Upfront.Views.ContextMenuItem({
						get_label: function() {
							return l10n.edit_text;
						},
						action: function() {
							var editor = me.for_view.$el.find('div.upfront-object-content').data('ueditor');
							if(!me.for_view.$el.find('div.upfront-object-content').data('redactor')){
								editor.start();
								$(document).on('click', function(e){
									//Check if the click has been inner, or inthe popup, or the context menu, otherwise stop the editor
									if(!editor.options.autostart && editor.redactor){
										var $target = $(e.target);
										if(!editor.disableStop && !$target.closest('li').length && !$target.closest('.redactor_air').length && !$target.closest('.ueditable').length){
											editor.stop();
										}
									}
								});
							}
						}
					})
				]);
			}
		});

	return TextMenuList;
});
})(jQuery);
