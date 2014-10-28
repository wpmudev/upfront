define([
	'scripts/upfront/inline-panels/l10n',
	'scripts/upfront/inline-panels/panel',
	'scripts/upfront/inline-panels/collapsed-multi-control'
], function (l10n, Panel, CollapsedMultiControl) {
	var ControlPanel = Panel.extend({
		position_v: 'none', // Image view will handle this
		position_h: 'none',
		setWidth: function(width) {
			var itemWidth = 40,
				items = this.items._wrapped,
				collapsed = !!items.collapsed,
				collapsableItems,
				collapsedControl;

			if(!collapsed && items.length > 3 && width < items.length * itemWidth){
				collapsableItems = items.slice(1, items.length -1);
				collapsedControl = new CollapsedMultiControl();

				_.each(collapsableItems, function(item) {
					collapsedControl.sub_items[item.icon] = item;
				});

				collapsedControl.icon = 'collapsedControl';
				collapsedControl.tooltip = l10n.ctrl.more_tools;
				collapsedControl.position = 'left';

				this.items = _([items[0], collapsedControl, items[items.length - 1]]);
				return;
			}
			if(collapsed) {
				var total = 2 + items[1].sub_items.length;
				if(total * itemWidth <= width) {
					var newitems = [items[0]],
						subitems = items[1].subitems
					;
					_.each(subitems, function(item) {
						newitems.push(item);
					});
					newitems.push(items[2]);

					this.items = newitems;
				}
			}
		},
		delegateEvents: function(){
			Backbone.View.prototype.delegateEvents.call(this, arguments);
			this.items.each(function(item){
				item.delegateEvents();
			});
		}
	});

	return ControlPanel;
});
