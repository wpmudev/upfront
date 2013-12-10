;(function($){
  $(function () {
	$('.accordion-panel:not(.accordion-panel-active) .accordion-panel-content').hide();	
	
	$('body').on('click', '.accordion-panel', function(event) {
      var $panel = $(event.currentTarget);
      var contentId;

      if ($panel.hasClass('accordion-panel-active')) {
        return;
      }

      $panel.addClass('accordion-panel-active').find('.accordion-panel-content').show('normal');
      $panel.siblings().removeClass('accordion-panel-active').find('.accordion-panel-content').hide('normal');
    });

  });
})(jQuery);
