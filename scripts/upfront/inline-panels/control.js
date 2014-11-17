define([
	'scripts/upfront/inline-panels/item'
], function (Item) {
	var Control = Item.extend({
		events: {
			'click': 'clicked'
		},

		clicked: function(e){
			e.preventDefault();
            e.stopPropagation();
			this.$el
				.siblings('.upfront-inline-panel-subitem-active')
				.removeClass('upfront-inline-panel-subitem-active')
			;
			this.trigger('click', e);
		},

		setIsSelected: function(isSelected) {
			if (isSelected) {
				this.$el.addClass('inline-panel-item-selected');
				return;
			}

			this.$el.removeClass('inline-panel-item-selected');
		}
	});

	return Control;
});
