define([
	'scripts/upfront/inline-panels/control'
], function (Control) {
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.content
		: Upfront.mainData.l10n.global.content
	;

	var VisitLinkControl = Control.extend({
		className: 'upfront-inline-panel-item visit-link-control',
		initialize: function(options) {
			this.options = options || {};
			this.constructor.__super__.initialize.call(this, options);
			this.linkLabel = _.extend({
				unlink: l10n.not_linked,
				lightbox: l10n.open_lightbox,
				anchor: l10n.scroll_to_anchor,
				entry: l10n.go_to_post,
				external: l10n.open_ext_link,
				email: l10n.send_email,
				phone: l10n.call_number
			}, (options.linkLabel || {}));
			this.setOptions(this.options.url, this.options.type);
			this.hideIfUnlink = ( options.hideIfUnlink === true );
			this.setOptions(this.options.url);
		},

		setOptions: function(url, type) {
			var theType = type ? type : Upfront.Util.guessLinkType(url);
			this.url = url;
			this.icon = 'visit-link-' + theType,
			this.label = this.getTextByLinkType(theType);
		},

		clicked: function(event) {
			this.constructor.__super__.clicked.call(this, event);
			if(this.url !== "") {
				Upfront.Util.visitLink(this.url);
			}
		},

		setLink: function(url, type) {
			this.setOptions(url, type);
			this.render();
		},

		on_render: function () {
			if (this.hideIfUnlink && Upfront.Util.guessLinkType(this.url) == 'unlink') {
				this.$el.hide();
			}
			else if (!this.$el.is(':visible')) {
				this.$el.show();
			}
		},

		getTextByLinkType: function(linktype) {
			return this.linkLabel[linktype];
		},

	});

	return VisitLinkControl;
});
