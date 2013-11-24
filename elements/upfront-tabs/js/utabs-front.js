;(function($){
  $(function () {
    $('body').on('click', '.tabs-tab', function(event) {
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
  });
})(jQuery);
