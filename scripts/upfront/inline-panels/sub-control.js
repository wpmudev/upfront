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
			
			this.listenTo(Upfront.Events, "upfront:hide:subControl", this.close);
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
			Upfront.Events.trigger('upfront:hide:paddingPanel');
			this.trigger('panel:open');
			
			var parent = this.$el.closest('.upfront-inline-panel');
			
			if(this.inline === true) {
				parent.removeClass('upfront-panels-shadow');
			}
			
			this.updateWidth();
		},

		close: function() {
			this.isOpen = false;
			this.$el.removeClass('upfront-sub-control-dialog-open');
			this.trigger('panel:close');
			
			var parent = this.$el.closest('.upfront-inline-panel');
			
			if(this.inline === true) {
				if(!parent.hasClass('upfront-panels-shadow')) {
					parent.addClass('upfront-panels-shadow');
				}
			}
		},

		render: function() {
			Item.prototype.render.call(this, arguments);
			var captionControl = this.$('.image-sub-control'),
				me = this,
				selectedItem
			;
			
			this.item_count = 0;

			if(!captionControl.length){
				if(this.inline === true) {
					captionControl = $('<div class="image-sub-control upfront-panels-shadow inline-panel-sub-control-no-dropdown inline-panel-sub-control-dialog"></div>');
				} else {
					captionControl = $('<div class="image-sub-control upfront-panels-shadow inline-panel-sub-control-dialog"></div>');
				}
				this.$el.append(captionControl);
			}
			_.each(this.sub_items, function(item, key){
				if(key === me.selected){
					item.setIsSelected(true);
				} else {
					item.setIsSelected(false);
				}
				
				if(me.inline === true) {
					item.panel_type = 'tooltip';
				}
				
				item.render();
				item.delegateEvents();
				captionControl.append(item.$el);
				me.item_count++;
			});

			// Prepend arrow, it is not set like pseudo element because we cant update its styles with jQuery
			var panelArrow = '<span class="upfront-control-arrow"></span>';
			this.$el
				.find('.image-sub-control').prepend(panelArrow);
		},
		
		updateWidth: function () {
			//Set width depending of items
			this.$el
				.find('.image-sub-control').css('width', (28 * this.item_count) + 2);

			//Show sub controls on each open
			this.$el
				.find('.upfront-inline-panel-item').show();
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
