;(function($,sr){

  // debouncing function from John Hann
  // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
  var debounce = function (func, threshold, execAsap) {
	  var timeout;

	  return function debounced () {
		  var obj = this, args = arguments;
		  function delayed () {
			  if (!execAsap)
				  func.apply(obj, args);
			  timeout = null;
		  };

		  if (timeout)
			  clearTimeout(timeout);
		  else if (execAsap)
			  func.apply(obj, args);

		  timeout = setTimeout(delayed, threshold || 400);
	  };
  }
  // smartresize 
  jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };

})(jQuery,'smartresize');

jQuery(document).ready(function($) {
	function roll_responsive_nav(selector, bpwidth) {
		$(selector).each(function () {

			var breakpoints = $(this).data('breakpoints');

			var bparray = new Array();
			var currentwidth = (typeof(bpwidth) != 'undefined') ? parseInt(bpwidth):$(window).width();
			
			for (var key in breakpoints) {
				bparray.push(breakpoints[key])
			}
			
			bparray.sort(function(a, b) {
				return a.width - b.width;
			});

			for (var key in bparray) {
				if(parseInt(currentwidth) >= parseInt(bparray[key]['width'])) {
					if(bparray[key]['burger_menu'] == 'yes') {
						$(this).attr('data-style', 'burger')
						$(this).attr('data-burger_alignment', bparray[key]['burger_alignment']);
						$(this).attr('data-burger_over', bparray[key]['burger_over']);
					}
					else {
						$(this).attr('data-style', $(this).data('stylebk'))
						$(this).removeAttr('data-burger_alignment','');
						$(this).removeAttr('data-burger_over', '');
					}
					
				}
			}			
		});
	}
	roll_responsive_nav(".upfront-output-unewnavigation > .upfront-navigation");
	
	$(window).smartresize(function() {roll_responsive_nav(".upfront-output-unewnavigation > .upfront-navigation");});
	$(document).on('changed_breakpoint', function(e) { roll_responsive_nav( e.selector, e.width);} );
});

