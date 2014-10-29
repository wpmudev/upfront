(function ($) {
define([
	'scripts/upfront/inline-panels/l10n',
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/control'
], function (l10n, Item, Control) {
	var TooltipControl = Control.extend({
		multiControl: true,

		events: {
			'click': 'onClickControl',
			'click .upfront-inline-panel-item': 'selectItem'
		},

		onClickControl: function(e){
			var  closestLayout = this.$el.closest('.upfront-grid-layout'),
					closestWrapper = this.$el.closest('.upfront-wrapper');

			if (this.isDisabled) {
				return;
			}

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
			var captionControl = this.$('.uimage-caption-control'),
				me = this,
				selectedItem
			;
			if(!this.$el.hasClass('uimage-caption-control-item')) {
				this.$el.addClass('uimage-caption-control-item');
			}

			if(!captionControl.length){
				captionControl = $('<div class="uimage-caption-control"></div>');
				this.$el.append(captionControl);
			}
			_.each(this.sub_items, function(item, key){
				if(key === me.selected){
					item.setIsSelected(true);
				} else {
					item.setIsSelected(false);
				}
				item.render();
				captionControl.append(item.$el);
			});

			selectedItem = this.sub_items[this.selected];
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
				target = $(e.target).is('i') ? $(e.target) : $(e.target).find('i');

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
		},

		setDisabled: function(isDisabled) {
			this.isDisabled = isDisabled;
			if (isDisabled) {
				this.tooltip = l10n.ctrl.caption_position_disabled;
			} else {
				this.tooltip = l10n.ctrl.caption_position;
			}
		}

	});

	return TooltipControl;
});
})(jQuery);
