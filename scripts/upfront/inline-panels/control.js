define([
	'scripts/upfront/inline-panels/item'
], function (Item) {
	var Control = Item.extend({
		events: {
			'click': 'clicked'
		},
		clicked: function(e){
			e.preventDefault();
			this.$el
				.siblings('.upfront-inline-panel-subitem-active')
				.removeClass('upfront-inline-panel-subitem-active')
			;
			this.trigger('click', e);
		}
	});

	return Control;
});
