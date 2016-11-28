(function ($) {
define([], function () {
	var InlineTooltip = Backbone.View.extend({
		className: 'upfront-inline-tooltip',

		initialize: function (options) {
			
			var $element = $(options.element),
				me = this
			;

			$element
			.on("mouseenter", function ($element) {
				me.openTooltip($element, options.content)
			})
			.on("mouseleave", function (e) {
				me.closeTooltip();
			});
		},

		openTooltip: function(e, content) {
			var tooltip = $('#upfront-inline-tooltip'),
				element = $(e.currentTarget).closest('.upfront-inline-panel'),
				elementPosition = element.offset(),
				tooltipPosition = {
					top: elementPosition.top - element.outerHeight() + 7,
					left: elementPosition.left
				},
				me = this
			;

			if(!tooltip.length){
				tooltip = $('<div id="upfront-inline-tooltip" class="upfront-ui"></div>');
				$('body').append(tooltip);
			}
			
			tooltip.hide().html(content);
			
			tooltip
				.css(tooltipPosition)
				.show()
				.on('click', function(e){
					e.stopPropagation();
				})
				.on('closed', function(e){
					me.$el.removeClass('tooltip-open');
				})
			;

			this.$el.addClass('tooltip-open');
		},
		
		closeTooltip: function(){
			var tooltip = $('#upfront-inline-tooltip');
			tooltip.hide().trigger('closed');
		},

	});

	return InlineTooltip;
});
})(jQuery);