(function ($) {
define([
	'scripts/upfront/inline-panels/controls/link-panel'
], function (LinkPanelControl) {
	
	var l10n = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
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

			this.view = new Upfront.Views.Editor.LinkPanel({
				linkUrl: this.options.linkUrl,
				linkType: this.options.linkType,
				linkTarget: this.options.linkTarget,
				linkObject: this.options.linkObject,
				linkObjectId: this.options.linkObjectId,
				button: false,
				title: l10n.link_group_to
			});
			this.linkUrl = this.options.linkUrl;
			this.listenTo(this.view, 'change change:target change:type', function(data) {
				me.linkUrl = data.url;
				me.render_label();
				this.trigger('change', data);
			});
		},
		
		label: function () {
			return ( Upfront.Util.guessLinkType(this.linkUrl) != 'unlink' ? l10n.edit_link : l10n.not_linked );
		},

		onClickControl: function(e){
			this.$el.siblings('.upfront-control-dialog-open').removeClass('upfront-control-dialog-open');
			
			if($(e.target).closest('.inline-panel-control-dialog').length) {
				return;
			}

			e.preventDefault();

			if(this.isopen) {
				this.close();
			} else {
				this.open();
			}
		},
	});

	return GroupLinkPanelControl;
});
})(jQuery);
