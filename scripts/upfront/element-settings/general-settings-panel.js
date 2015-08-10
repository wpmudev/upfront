(function($) {
define([
	'scripts/upfront/element-settings/base-panel',
], function(BasePanel) {
	var GeneralSettingsPanel = BasePanel.extend({
		getTitle: function() {
			return 'General Settings';
		},

		getBody: function() {
			var $body = $('<div />');
			this.settings.each(function (setting) {
				if ( ! setting.panel ) setting.panel = me;
				setting.render();
				$body.append(setting.el)
			});
			return $body;
		}
	});

	return GeneralSettingsPanel;
});
})(jQuery);
