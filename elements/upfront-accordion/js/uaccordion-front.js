;(function($){
  $(function () {
	$('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();	
	
	$('body').on('touchstart click', '.accordion-panel', function(event) {
      var $panel = $(event.currentTarget);
      var contentId;

      if ($panel.hasClass('accordion-panel-active')) {
        return;
      }
      $panel.addClass('accordion-panel-active').find('.accordion-panel-content').slideDown();
      $panel.siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').slideUp();
    });

  });
})(jQuery);
