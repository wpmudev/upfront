(function ($) {
define([
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/control'
], function (Item, Control) {
	var TooltipControl = Control.extend({
		events: {
			'click': 'onClickControl',
			'click .upfront-inline-panel-item': 'selectItem'
		},

		onClickControl: function(e){
			var  closestLayout = this.$el.closest('.upfront-grid-layout'),
					closestWrapper = this.$el.closest('.upfront-wrapper');

			e.preventDefault();

			this.clicked(e);

			if (this.$el.hasClass('open')) {
				this.$el.removeClass('open');
				closestLayout.removeClass('upfront-grid-layout-current');
				closestWrapper.removeClass('upfront-wrapper-current');
			} else {
				this.$el.addClass('open');
				closestLayout.addClass('upfront-grid-layout-current');
				closestWrapper.addClass('upfront-wrapper-current');
			}
		},

		render: function() {
			Item.prototype.render.call(this, arguments);
			var tooltip = this.$('.uimage-control-tooltip'),
				me = this
			;
			if(!this.$el.hasClass('uimage-control-tooltip-item')) {
				this.$el.addClass('uimage-control-tooltip-item');
			}

			if(!tooltip.length){
				tooltip = $('<div class="uimage-control-tooltip"></div>');
				this.$el.append(tooltip);
			}
			_.each(this.sub_items, function(item, key){
				if(key !== me.selected){
					item.render();
					tooltip.append(item.$el);
				}
			});

			var selectedItem = this.sub_items[this.selected];
					if(selectedItem){
							if( typeof selectedItem.icon !== 'undefined' ){
									this.$el.children('i').addClass('upfront-icon-region-' + selectedItem.icon);
							}else if( typeof selectedItem.label !== 'undefined' ){
									this.$el.find('.tooltip-content').append( ': ' +  selectedItem.label );
							}

					}
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

				if( !found && $(e.target).closest('.upfront-inline-panel-item').attr('id') === item.id ){
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

	return TooltipControl;
});
})(jQuery);
