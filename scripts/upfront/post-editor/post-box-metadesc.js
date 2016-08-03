;(function ($) {

define(["text!upfront/templates/post-editor/edition-box.html"], function (editionBox_tpl) {

	var Post_Box_Metadesc = Backbone.View.extend({
		/**
		 * Internal meta description key
		 *
		 * @type {String}
		 */
		meta_key: '_metadesc',

		/**
		 * List of supported meta description keys
		 * for value extraction
		 *
		 * @type {Array}
		 */
		supported_meta_keys: [
			'_metadesc',
			'_wds_metadesc'
		],

		events: {
			"click a.ueditor-save-post-data": "handle_metadesc_update",
			"keyup textarea": "handle_counter_update"
		},

		initialize: function () {
			this.meta_key = ((Upfront.data || {}).metadata || {}).key || this.meta_key;
			this.supported_meta_keys = ((Upfront.data || {}).metadata || {}).supported_meta_keys || this.supported_meta_keys;
		},

		render: function () {
			var html = _.template($(editionBox_tpl).find("#post-box-metadesc").html())({
				metadesc: this.get_current_metadesc(),
				char_limit: this.get_char_limit()
			});

			this.undelegateEvents();
			this.$el
				.empty()
				.append(html)
			;
			this.delegateEvents();

			return this;
		},

		/**
		 * Char limit getter
		 *
		 * @return {Integer}
		 */
		get_char_limit: function () {
			return 16;
		},

		/**
		 * Handles meta description update requests
		 *
		 * @param {Object} e Event
		 *
		 * @return {Boolean}
		 */
		handle_metadesc_update: function (e) {
			var current = this.$el.find("textarea").val();
			this.set_current_metadesc(current);
			return true;
		},

		/**
		 * Handles counter update
		 *
		 * Side-effects only
		 *
		 * @param {Object} e Event
		 */
		handle_counter_update: function (e) {
			var $counter = this.$el.find(".char-counter"),
				current = this.$el.find("textarea").val().length,
				allowed = this.get_char_limit()
			;
			if (current > allowed) $counter.addClass("over-limit");
			else $counter.removeClass("over-limit");

			$counter.find(".current").text(current);
		},

		/**
		 * Gets current post meta description
		 *
		 * Will look into several places:
		 * 	- Metadesc (self-contained field)
		 * 	- SmartCrawl meta field
		 * 	- post excerpt
		 *
		 * @return {String}
		 */
		get_current_metadesc: function () {
			var metadesc = '';
			if (!this.model || !(this.model || {}).get) return metadesc;

			if (this.model.meta && (this.model.meta || {}).getValue) {
				metadesc = _.reduce(this.supported_meta_keys, function (prev, key) {
					return this.model.meta.getValue(key) || prev;
				}, '', this);
			}

			metadesc = metadesc || (this.model.get("post_excerpt") || '');

			return metadesc;
		},

		/**
		 * Sets current post meta description
		 *
		 * The new value will be placed in internal _metadesc field
		 *
		 * @param {String} value New value for the meta decription
		 *
		 * @return {Boolean}
		 */
		set_current_metadesc: function (value) {
			if (!(this.model || {}).meta || !((this.model || {}).meta).setValue) return false;

			this.model.meta.setValue(this.meta_key, value);

			return true;
		}
	});

	return Post_Box_Metadesc;
});

})(jQuery);
