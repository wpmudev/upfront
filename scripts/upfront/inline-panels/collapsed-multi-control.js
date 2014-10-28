(function ($) {
define([
	'scripts/upfront/inline-panels/control',
	'scripts/upfront/inline-panels/multi-control'
], function (Control, MultiControl) {
	var CollapsedMultiControl = MultiControl.extend({
		collapsed: true,
		className: 'upfront-inline-panel-item inline-panel-collapsed-control',
		render: function(){
			if(!this.sub_items.collapsedControl){
				var control = new Control();
				control.icon = 'collapsedControl';
				control.tooltip = 'More tools';
				this.sub_items.collapsedControl = control;
			}
			this.selected = 'collapsedControl';

			this.constructor.__super__.render.call(this, arguments);
		},

		selectItem: function(e){
			var found = false,
				foundKey = false,
				target = $(e.target).is('i') ? $(e.target) : $(e.target).find('i')
			;

			_.each(this.sub_items, function(item, key){
				if(target.hasClass('upfront-icon-region-' + item.icon)){
					found = item;
					foundKey = key;
				}
			});

			if(found){
				if(found instanceof MultiControl || found.multiControl === true){
					return false;
				}
				else {
					this.render();
					this.trigger('select', foundKey);
				}
			}
		},

		open_subitem: function () {
			_.each(this.sub_items, function(item){
				if(item instanceof MultiControl){
					item.close_subitem();
				}
			});
			this.constructor.__super__.open_subitem.call(this, arguments);
		}
	});

	return CollapsedMultiControl;
});
})(jQuery);
