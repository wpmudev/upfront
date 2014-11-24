(function ($) {
define([
	'scripts/upfront/inline-panels/item-multi'
], function (ItemMulti) {
	var MultiControl = ItemMulti.extend({
	events: {
		'click': 'clicked',
		'click .upfront-inline-panel-item': 'selectItem'
	},
	render: function(){
		ItemMulti.prototype.render.call(this, arguments);
	},
	clicked: function(e){
		var $subitem = this.$el.children('.upfront-inline-panel-subitem');
		if ( $(e.target).closest($subitem).length > 0 )
			return;
		this.trigger('click', e);
		this.toggle_subitem();
	},
	get_selected_item: function () {
		return this.selected;
	},
	selectItem: function(e){
		var found = false,
			target = $(e.target).is('i') ? $(e.target) : $(e.target).find('i')
		;
		_.each(this.sub_items, function(item, key){
			if(target.hasClass('upfront-icon-region-' + item.icon)) {
				found = key;
			}
		});

		if(found){
			this.selected = found;
			this.render();
			this.trigger('select', found);
		}
	}

	});

	return MultiControl;
});
})(jQuery);
