;(function($){
  $(function () {
    $('body').on('touchstart click', '.tabs-tab', function(event) {
      var $tab = $(event.currentTarget);
      var contentId;

      if ($tab.hasClass('tabs-tab-active')) {
        return;
      }

      $tab.addClass('tabs-tab-active');
      $tab.siblings().removeClass('tabs-tab-active');

      contentId = $tab.data('content-id');
      $('#' + contentId).addClass('tab-content-active')
        .siblings().removeClass('tab-content-active');
    });

    // Add tooltip if tab title is cutoff with ellipsis
    $('.tabs-tab').each(function() {
      var span = $(this).find('span')[0];
      if (span.offsetWidth < span.scrollWidth) {
        $(this).attr('title', $(span).text().trim());
      }
    });
  });
})(jQuery);
