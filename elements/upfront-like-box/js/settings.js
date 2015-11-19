define([], function() {


	// ----- Settings API -----
	// We'll be working from the bottom up here.
	// We will first define settings panels, and items for each panel.
	// Then we'll slot in the panels in a settings instance.

	/**
	 * Layout Style settings - Facebook Page URL item
	 * @type {Upfront.Views.Editor.Settings.Item}
	 */

	var l10n = Upfront.Settings.l10n.like_box_element;

	var Field_Text = Upfront.Views.Editor.Field.Text.extend({});

	var Field_Button = Upfront.Views.Editor.Field.Field.extend({
		events: {
			'click a': 'buttonClicked'
		},
		render: function() {
			this.$el.html(this.get_field_html());
		},
		get_field_html: function() {
			return '<i class="upfront-field-icon upfront-field-icon-social-back"></i><span class="upfront-back-global-settings-info">' + this.options.info + ' <a href="#">' + this.options.label + '</a></span>';
		},
		buttonClicked: function(e) {
			if(this.options.on_click)
				this.options.on_click(e);
		},
		isProperty: false
	});

	var LikeBoxSettings = Upfront.Views.Editor.Settings.Settings.extend({
		/**
		 * Bootstrap the object - populate the internal
		 * panels array with the panel instances we'll be showing.
		 */
		 getGlobalFBUrl: function(){
			if(!Upfront.data.usocial.globals)
				return false;
			var services = Upfront.data.usocial.globals.services,
				url = false;

			_(services).each( function( s ) {
				if(s.id == 'facebook')
					url = s.url;
			});

			return url;
		},

		initialize: function (opts) {
			this.options = opts;
			this.has_tabs = false;
			this.panel = new Upfront.Views.Editor.Settings.Panel({

					model: this.model,
					label: l10n.opts.style_label,
					title: l10n.opts.style_title,
					settings: [
						new Upfront.Views.Editor.Settings.Item({
							className: 'upfront-social-services-item',
							model: this.model,
							title: l10n.opts.page_url,
							fields: [
								new Field_Text({
									model: this.model,
									property: 'facebook_url',
									label: l10n.opts.url_sample,
									compact: true
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'show_friends',
										label: "",
										values: [
											{ label: l10n.opts.show_friends, value: 'yes' }
										]
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'small_header',
										label: "",
										values: [
											{ label: l10n.opts.small_header, value: 'yes' }
										]
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'hide_cover',
										label: "",
										values: [
											{ label: l10n.opts.hide_cover, value: 'yes' }
										]
								}),
								new Upfront.Views.Editor.Field.Checkboxes({
										model: this.model,
										property: 'show_posts',
										label: "",
										values: [
											{ label: l10n.opts.show_posts, value: 'yes' }
										]
								})
							]
						})

					]
				});
			this.panels = _([this.panel]);
		},
		/**
		 * Get the title (goes into settings title area)
		 * @return {string} Title
		 */
		get_title: function () {
			return l10n.settings;
		}
	});


	return LikeBoxSettings;
});