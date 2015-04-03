define([
	'scripts/upfront/inline-panels/item'
], function (Item) {
	var Control = Item.extend({
		events: {
			'click': 'clicked'
		},

		initialize: function(options) {
			this.options = options || {};
			this.label = this.options.label;
			this.icon = this.options.icon;
		},

		clicked: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.$el
				.siblings('.upfront-inline-panel-subitem-active')
				.removeClass('upfront-inline-panel-subitem-active');

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
