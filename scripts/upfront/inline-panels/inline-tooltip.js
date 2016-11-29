(function ($) {
define([], function () {
	
	$.fn.utooltip = function (args) {
		this.each(function (id, item) {		
			var content, 
				panel = args.panel;

			if(args.fromTitle === true) {
				content = $(item).attr('title');
			} else {
				content = args.content;
			}

			tooltip = new InlineTooltip({
				element: $(item),
				content: content,
				panel: panel,
				wrapper: false
			});
			
		});
	}
	
	var InlineTooltip = Backbone.View.extend({
		className: 'upfront-inline-tooltip',

		initialize: function (options) {			
			var $element = $(options.element).find('.upfront-icon'),
				me = this
			;
			
			this.options = options;
			
			if(typeof this.options.wrapper !== "undefined" && this.options.wrapper === false) {
				$element = $(options.element);
			}
			
			if(typeof this.options.panel !== "undefined" && this.options.panel === 'redactor') {
				$element = $(options.element).find('.re-icon');
			}
			
			if(typeof this.options.panel !== "undefined" && (this.options.panel === 'side' || this.options.panel === 'normal')) {
				$element = $(options.element).find('label');
			}

			$element
			.on("mouseenter", function ($element) {
				me.openTooltip($element, options.content)
			})
			.on("mouseleave", function (e) {
				me.closeTooltip();
			});
			
			this.listenTo(Upfront.Events, 'crop:inteface:activated', this.closeTooltip);
		},

		openTooltip: function(e, content) {
			var tooltip = $('#upfront-inline-tooltip'),
				element = $(e.currentTarget).closest('.upfront-inline-panel'),
				me = this
			;

			if(typeof this.options.panel !== "undefined" && this.options.panel === 'tooltip') {
				element = $(e.currentTarget).closest('.image-sub-control');
			}
			
			if(typeof this.options.panel !== "undefined" && this.options.panel === 'redactor') {
				element = $(e.currentTarget).closest('.redactor_air');
			}

			var elementPosition = element.offset(),
				tooltipPosition = {
					top: elementPosition.top - element.outerHeight() + 7,
					left: elementPosition.left
				}
			;
			
			if(typeof this.options.panel !== "undefined" && this.options.panel === 'side') {
				element = $(e.currentTarget).closest('li');
				
				elementPosition = element.offset();
				
				tooltipPosition = {
					top: elementPosition.top + 4,
					left: elementPosition.left + element.outerWidth() + 5
				}
			}

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