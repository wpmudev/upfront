(function ($) {
define([], function () {
	var Panels = Backbone.View.extend({
		className: 'upfront-inline-panels upfront-ui',
		initialize: function () {
			this.panels = _([]);
		},
		render: function () {
			var me = this,
				panels = typeof this.panels === 'function' ? this.panels() : this.panels,
				$wrap = $('<div class="upfront-inline-panels-wrap" />');
			this.$el.html('');
			panels.each(function(panel){
				if ( !panel ) {
					return;
				}
				panel.panels_view = me;
				panel.render();
				panel.delegateEvents();
				$wrap.append(panel.el);
			});
			this.$el.append($wrap);
			if ( typeof this.on_render === 'function' ) {
				this.on_render();
			}
		},
		on_active: function () {
			$('.upfront-inline-panels-active').removeClass('upfront-inline-panels-active');
			this.$el.addClass('upfront-inline-panels-active');
		},
		remove: function() {
			var panels = typeof this.panels === 'function' ? this.panels() : this.panels;
			if(panels) {
				panels.each(function(panel){
					panel.remove();
				});
			}
			Backbone.View.prototype.remove.call(this);
		}
	});

	return Panels;
});
})(jQuery);
