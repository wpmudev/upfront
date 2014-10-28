define([], function () {
	var Panel = Backbone.View.extend({
		className: 'upfront-inline-panel upfront-no-select',
		position_v: 'top',
		position_h: 'center',
		initialize: function () {
			this.items = _([]);
		},
		render: function() {
			var items = typeof this.items === 'function' ? this.items() : this.items,
				classes = [
					'upfront-inline-panel-'+this.position_v,
					'upfront-inline-panel-'+this.position_v+'-'+this.position_h
				],
				width = 0,
				height = 0;

			this.$el.html('');
			this.collapsedParent = false;

			items.each(function(item){
				item.panel_view = this;
				item.render();
				item.delegateEvents();

				this.$el.append(item.el);

				if (item.collapsed) {
					classes.push('upfront-inline-panel-collapsed-parent');
					this.collapsedParent = true;
				}

				if ( this.position_v === 'center' ) {
					width = item.width > width ? item.width : width;
					height += item.height;
				} else {
					width += item.width;
					height = item.height > height ? item.height : height;
				}
			}, this);

			this.$el.addClass(this.className + ' ' + classes.join(' '));

			if (this.collapsedParent) {
				height = 13;
			}

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
