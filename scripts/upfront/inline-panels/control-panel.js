define([
	'scripts/upfront/inline-panels/panel',
	'scripts/upfront/inline-panels/collapsed-multi-control',
	'scripts/upfront/inline-panels/tooltip-control'
], function (Panel, CollapsedMultiControl, TooltipControl) {
	var l10n = Upfront.mainData.l10n.image_editor;

	var ControlPanel = Panel.extend({
		position_v: 'none', // Image view will handle this
		position_h: 'none',

		setWidth: function(optionsArg) {
			var items = this.items._wrapped,
				collapsedControl,
				options = _.extend({
					widthThreshold: 100,
					width: 101,
					heightThreshold: 100,
					height: 101
				}, optionsArg);


			if(options.width < options.widthThreshold || options.height < options.heightThreshold){
				if (this.collapsed !== true) {
					collapsedControl = new CollapsedMultiControl();

				_.each(items, function(item) {
					if (item instanceof TooltipControl) {
						item.setDisabled(true);
					}
					collapsedControl.sub_items[item.icon] = item;
				});

				collapsedControl.icon = 'collapsedControl';
				collapsedControl.tooltip = l10n.ctrl.more_tools;
				collapsedControl.position = 'left';

					this.items = _([collapsedControl]);
					this.collapsed = true;
				}
			} else {
				// Uncolapse
				if (this.collapsed) {
					this.items = _([]);
					_.each(items[0].sub_items, function(item, index) {
						if (index !== 'collapsedControl') {
							this.items.push(item);
						}
						if (item instanceof TooltipControl) {
							item.setDisabled(false);
						}
					}, this);
				}
				this.collapsed = false;
			}
		},

		delegateEvents: function(){
			Backbone.View.prototype.delegateEvents.call(this, arguments);
			if (this.items && this.items.each) this.items.each(function(item){
				item.delegateEvents();
			});
		}
	});

	return ControlPanel;
});
