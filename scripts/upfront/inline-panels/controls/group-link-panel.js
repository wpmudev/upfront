(function ($) {
define([
	'scripts/upfront/inline-panels/controls/link-panel',
	"scripts/upfront/link-model"
], function (LinkPanelControl, LinkModel) {

	var l10n = Upfront.Settings && Upfront.Settings.l10n ?
		Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views
	;

	var GroupLinkPanelControl = LinkPanelControl.extend({
		className: 'upfront-inline-panel-item group-link-control',
		initialize: function(options) {
			var me = this;
			this.options = options || {};
			this.constructor.__super__.constructor.__super__.initialize.call(this, options);

			this.icon = this.options.icon;
			this.tooltip = this.options.tooltip;
			this.id = this.options.id;

			this.link = new LinkModel({
				type: this.options.linkType,
				url: this.options.linkUrl,
				target: this.options.linkTarget,
				object: this.options.linkObject,
				object_id: this.options.linkObjectId
			});
			this.view = new Upfront.Views.Editor.LinkPanel({
				model: this.link,
				button: false,
				title: l10n.link_group_to
			});
			this.listenTo(this.link, 'change change:target change:type', function(link) {
				me.render_label();
				this.trigger('change', {
					url: link.get('url'),
					target: link.get('target'),
					type: link.get('type')
				});
			});
			this.listenTo(this.link, 'change:type', function(link) {
				if(link.get('type') === 'entry') {
					this.trigger('change:type');
				}
			});
		}		
	});

	return GroupLinkPanelControl;
});
})(jQuery);
