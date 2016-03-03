(function ($) {
define([
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/control'
], function (Item, Control) {
	var l10n = Upfront.mainData.l10n.image_element;

	var SubControl = Control.extend({
		multiControl: true,

		events: {
			'click': 'onClickControl',
			'click .upfront-inline-panel-item': 'selectItem'
		},

		initialize: function() {
			var me = this;
			$(document).click(function(e){
				var	target = $(e.target);

				if(target.closest('#page').length && target[0] !== me.el && !target.closest(me.el).length && me.isOpen) {
					me.close();
				}
			});
		},

		onClickControl: function(e){
			if (this.isDisabled) {
				return;
			}

			e.preventDefault();

			this.clicked(e);

			this.$el.siblings('.upfront-sub-control-dialog-open').removeClass('upfront-sub-control-dialog-open');

			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		},

		open: function() {
			this.isOpen = true;
			this.$el.addClass('upfront-sub-control-dialog-open');
		},

		close: function() {
			this.isOpen = false;
			this.$el.removeClass('upfront-sub-control-dialog-open');
		},

		render: function() {
			Item.prototype.render.call(this, arguments);
			var captionControl = this.$('.image-sub-control'),
				me = this,
				selectedItem,
				item_count = 0
			;

			if(!captionControl.length){
				captionControl = $('<div class="image-sub-control inline-panel-sub-control-dialog"></div>');
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
				item_count++;
			});

			//Set width depending of items
			this.$el
				.find('.image-sub-control').css('width', 30 * item_count);
		},

		get_selected_item: function () {
			return this.selected;
		},

		setDisabled: function(isDisabled) {
			this.isDisabled = isDisabled;
			if (isDisabled) {
				this.tooltip = l10n.ctrl.caption_position_disabled;
			} else {
				this.tooltip = l10n.ctrl.caption_display;
			}
		}
	});

	return SubControl;
});
})(jQuery);
