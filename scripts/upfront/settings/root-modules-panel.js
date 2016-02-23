(function ($) {
define([
	'scripts/upfront/settings/modules-container',
	'scripts/upfront/element-settings/root-panel-mixin'
],function(ModulesContainer, RootPanelMixin) {

	var RootModulesPanel = ModulesContainer.extend(
		_.extend({}, RootPanelMixin, {
			getBody: function() {
				var $body = $('<div />');

				$body.append('<div class="upfront-settings-item-content"></div>');

				var $content = $body.find('.upfront-settings-item-content');
				this.modules.each(function(module){
					module.render();
					module.delegateEvents();
					$content.append(module.el);
				});

				return $body;
			}
		})
	);

	return RootModulesPanel;
});
})(jQuery);
