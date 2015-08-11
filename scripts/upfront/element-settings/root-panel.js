(function ($) {
define([
	'scripts/upfront/element-settings/saveable-settings-panel'
], function (SaveableSettingsPanel) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var RootPanel = SaveableSettingsPanel.extend({
		className: 'uf-settings-panel upfront-settings_panel',

		events: {
			'click .uf-settings-panel__title': 'toggleBody'
		},

		getTitle: function () {
			return this.options.title ? this.options.title : 'Settings Panel Base';
		},

		/**
		 * Child classes need to override this method to return div with markup.
		 */
		getBody: function() {
			var $body = $('<div />');
			$body.append('<p>Implement getBody() in child class</p>');
			return $body;
		},

		toggleBody: function() {
			this.$el.find('.uf-settings-panel__body').toggle();
			this.$el.toggleClass('uf-settings-panel--expended');
		},

		render: function () {
			var body;

			this.$el.html('<div class="uf-settings-panel__title">' + this.getTitle() + '</div>');

			body = this.getBody();
			body.addClass('uf-settings-panel__body');
			this.$el.append(body);
		},

		cleanUp: function() {
			if(this.settings)
				this.settings.each(function(setting){
					setting.remove();
				});
			this.$el.off();
			this.remove();
		}

	});

	return RootPanel;
});
})(jQuery);
