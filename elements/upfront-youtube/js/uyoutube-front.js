
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

;(function($){
	$(function () {
    	$('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
			var videoUrl =  'http://www.youtube.com/embed/' + $(this).data('video-id') + '?modestbranding=1';
			$(this).siblings('.uyoutube-main-video').find('iframe').attr('src', videoUrl);
		});
	});
	
	$(window).on('load', function() {
	/*	$(window).resize(_.debounce(function() {
			fixVideoheight();	
		}, 500));*/
		fixVideoheight();
	});
	

	$(window).smartresize(function() {
		fixVideoheight();
	});

	function fixVideoheight() {
		$('.upfront-youtube-container > iframe').each(function() {
			$(this).css('height', parseInt($(this).width()/1.641, 10));
		});
	}

})(jQuery);
