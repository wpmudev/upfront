(function ($) {
define([
], function () {
	var RootPanelMixin = {
		className: 'uf-settings-panel upfront-settings_panel',

		events: {
			'click .uf-settings-panel__title': 'toggleBody'
		},

		getTitle: function () {
			var title = this.options.title ? this.options.title : this.title;
			title = title ? title : 'Default Panel Title';
			return title;
		},

		/**
		 * Child classes need to override this method to return div with markup.
		 */
		getBody: function() {
			var $body = $('<div />');
			$body.append('<p>Implement getBody() in child class</p>');
			return $body;
		},

		toggleBody: function () {
			this.$el.find('.uf-settings-panel__body').toggle();
			this.$el.toggleClass('uf-settings-panel--expanded');
		},

		/**
		 * Hides panel body
		 */
		hideBody: function () {
			this.$el.find('.uf-settings-panel__body').hide();
			this.$el.removeClass('uf-settings-panel--expanded');
		},

		/**
		 * Shows panel body
		 */
		showBody: function () {
			this.$el.find('.uf-settings-panel__body').show();
			this.$el.addClass('uf-settings-panel--expanded');
		},

		render: function () {
			var body;

			this.$el.html('<div class="uf-settings-panel__title">' + this.getTitle() + '</div>');

			body = this.getBody();
			body.addClass('uf-settings-panel__body');
			this.$el.append(body);
			this.$el.addClass('uf-settings-panel--expanded');
		}
	};

	return RootPanelMixin;
});
})(jQuery);
