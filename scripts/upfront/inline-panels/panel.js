define([], function () {
	var Panel = Backbone.View.extend({
		className: 'upfront-inline-panel upfront-no-select',
		position_v: 'top',
		position_h: 'center',
		initialize: function () {
			this.items = _([]);
		},
		render: function() {
			var me = this,
				items = typeof this.items === 'function' ? this.items() : this.items,
				classes = [
					'upfront-inline-panel-'+this.position_v,
					'upfront-inline-panel-'+this.position_v+'-'+this.position_h
				],
				width = 0,
				height = 0;
			this.$el.html('');
			items.each(function(item){
				item.panel_view = me;
				item.render();
				item.delegateEvents();
				me.$el.append(item.el);
				if ( me.position_v === 'center' ) {
					width = item.width > width ? item.width : width;
					height += item.height;
				} else {
					width += item.width;
					height = item.height > height ? item.height : height;
				}
			});
			this.$el.attr('class', this.className + ' ' + classes.join(' '));
			this.$el.css({
				width: width,
				height: height
			});
		},
		remove: function() {
			var items = typeof this.items === 'function' ? this.items() : this.items;

			if(items) {
				items.each(function(item){
					item.remove();
				});
			}
			Backbone.View.prototype.remove.call(this);
		}
	});

	return Panel;
});
