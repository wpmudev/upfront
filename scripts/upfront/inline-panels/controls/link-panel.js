define([
	'scripts/upfront/inline-panels/dialog-control'
], function (DialogControl) {
	var LinkPanelControl = DialogControl.extend({
		initialize: function(options) {
			this.options = options || {};
			this.constructor.__super__.initialize.call(this, options);

			this.icon = this.options.icon;
			this.tooltip = this.options.tooltip;
			this.id = this.options.id;

			this.view = new Upfront.Views.Editor.LinkPanel({
				linkUrl: this.options.linkUrl,
				linkType: this.options.linkType,
				linkTarget: this.options.linkTarget,
				button: false
			});
			this.listenTo(this.view, 'change change:target', function(data) {
				this.trigger('change', data);
			});
		},

		onClickOk: function(event){
			event.preventDefault();
			this.close();
		}
	});

	return LinkPanelControl;
});
