(function ($) {
define([
	'scripts/upfront/inline-panels/item',
	'scripts/upfront/inline-panels/control'
], function (Item, Control) {
	var l10n = Upfront.mainData.l10n.image_element;

	var TooltipControl = Control.extend({
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

			this.$el.siblings('.upfront-control-dialog-open').removeClass('upfront-control-dialog-open');

			if (this.isOpen) {
				this.close();
			} else {
				this.open();
			}
		},

		open: function() {
			this.isOpen = true;
			this.$el.addClass('upfront-control-dialog-open');
			this.trigger('panel:open');
			this.hideParentItems();
			this.updateWidth();
		},

		close: function() {
			this.isOpen = false;
			this.$el.removeClass('upfront-control-dialog-open');
			this.trigger('panel:close');
			this.showParentItems();
			
			var parentItems = this.$el.closest('.image-sub-control').children('.upfront-inline-panel-item');
			
			this.$el
				.closest('.image-sub-control').css('width', (28 * parentItems.length) + 2);
		},
		
		hideParentItems: function() {
			this.$el.parent().closest('.image-sub-control')
				.find('.upfront-inline-panel-item')
				.not('.uimage-caption-control-item, .uimage-caption-control-item .upfront-inline-panel-item')
				.hide();
		},
		
		showParentItems: function() {
			this.$el.parent().closest('.image-sub-control')
				.find('.upfront-inline-panel-item')
				.not('.uimage-caption-control-item, .uimage-caption-control-item .upfront-inline-panel-item')
				.show();
		},

		render: function() {
			Item.prototype.render.call(this, arguments);
			var captionControl = this.$('.uimage-caption-control'),
				me = this,
				selectedItem,
				wrapperClass = ''
			;
			
			this.item_count = 0;

			if(!this.$el.hasClass('uimage-caption-control-item')) {
				this.$el.addClass('uimage-caption-control-item');
			}

			if(typeof this.wrapperClass !== "undefined") {
				wrapperClass = this.wrapperClass;
			}

			if(!captionControl.length){
				captionControl = $('<div class="uimage-caption-control inline-panel-control-dialog '+ wrapperClass +'"></div>');
				this.$el.append(captionControl);
			}
			_.each(this.sub_items, function(item, key){
				if(key === me.selected){
					item.setIsSelected(true);
				} else {
					item.setIsSelected(false);
				}
				item.render();
				item.$el.find('i').addClass('upfront-icon-region-caption');
				captionControl.append(item.$el);
				me.listenTo(item, 'click', me.selectItem);
				me.item_count++;
			});

			selectedItem = this.sub_items[this.selected];
			if(selectedItem){
				if( typeof selectedItem.icon !== 'undefined' ){
					this.$el.children('i').addClass('upfront-icon-region-' + selectedItem.icon);
				} else if( typeof selectedItem.label !== 'undefined' ){
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
			
			if(found === "back") {
				this.close();
				return;
			}

			if(found) {
				this.selected = found;
				this.render();
				this.trigger('select', found);
			}
		},
		
		updateWidth: function () {
			//Set width depending of items
			this.$el
				.closest('.image-sub-control').css('width', (28 * this.item_count) + 2);
				
			this.$el
				.find('.uimage-caption-control').css('width', (28 * this.item_count) + 2);
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

	return TooltipControl;
});
})(jQuery);
