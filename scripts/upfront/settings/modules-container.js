define(function() {
	var ModulesContainer = Backbone.View.extend({
		render: function () {
			this.$el.append('<div class="upfront-settings-item-content"></div>');

			var $content = this.$el.find('.upfront-settings-item-content');
			this.modules.each(function(module){
				module.render();
				module.delegateEvents();
				$content.append(module.el);
			});
		}
	});

	return ModulesContainer;
});
