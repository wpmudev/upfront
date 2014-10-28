(function ($) {
define([
	'scripts/upfront/inline-panels/item'
], function (Item) {
	var ItemMulti = Item.extend({
		events: {
			'click >.upfront-icon': 'toggle_subitem'
		},
		initialize: function () {
			this.sub_items = {};
			this.listenTo(Upfront.Events, 'entity:region:activated', this.on_region_change);
		},
		get_selected_item: function () {},
		get_default_item: function () {},
		get_selected_icon: function (selected) {
			return selected + '-active';
		},
		set_selected_item: function () {},
		select_item: function (selected) {
			this.set_selected_item(selected);
			this.render();
		},
		render: function () {
			var me = this,
				selected = this.get_selected_item() || this.get_default_item(),
				$sub_items = $('<div class="upfront-inline-panel-subitem" />');
			this.$el.html('');
			this.icon = this.get_selected_icon(selected);
			this.render_icon();
			this.render_tooltip();
			_.each(this.sub_items, function(item, id){
				item.panel_view = me.panel_view;
				item.parent_view = me;
				item.render();
				item.delegateEvents();
				if ( selected != id ) {
					$sub_items.append(item.el);
				}
			});
			$sub_items.append(this.sub_items[selected].el);
			this.$el.append($sub_items);
		},
		toggle_subitem: function () {
			if ( this.$el.hasClass('upfront-inline-panel-subitem-active') ) {
				this.close_subitem();
			} else {
				this.open_subitem();
			}
		},
		open_subitem: function () {
			this.$el.addClass('upfront-inline-panel-subitem-active');
			this.$el.removeClass('upfront-inline-panel-subitem-inactive');
		},
		close_subitem: function () {
			this.$el.addClass('upfront-inline-panel-subitem-inactive');
			this.$el.removeClass('upfront-inline-panel-subitem-active');
		},
		on_region_change: function (region) {
			if ( region.model != this.model ) {
				this.close_subitem();
			}
		},
		remove: function(){
			if (this.sub_items) {
				_.each(this.sub_items, function(item){
					item.remove();
				});
			}
			this.panel_view = false;
			Backbone.View.prototype.remove.call(this);
		}
	});

	return ItemMulti;
});
})(jQuery);
