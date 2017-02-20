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
			if (this.$el.hasClass('uf-settings-panel--expanded')) this.hideBody();
			else this.showBody();
		},

		/**
		 * Hides panel body
		 */
		hideBody: function () {
			this.$el.removeClass('uf-settings-panel--expanded');
			this.trigger('hideBody');
		},

		/**
		 * Shows panel body
		 */
		showBody: function () {
			var body;
			this.$el.addClass('uf-settings-panel--expanded');
			
			if (this._bodyRendered) return;
			
			body = this.getBody();
			body.addClass('uf-settings-panel__body');
			this.$el.append(body);
			
			this._bodyRendered = true;
			
			this.trigger('body:rendered');
		},

		render: function () {
			this.$el.html('<div class="uf-settings-panel__title">' + this.getTitle() + '</div>');
		}
	};

	return RootPanelMixin;
});
})(jQuery);
