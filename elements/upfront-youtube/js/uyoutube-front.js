;(function($){
  $(function () {
    $('.uyoutube-gallery-item, .uyoutube-list-item').on('click', function(event) {
      var videoUrl =  'http://www.youtube.com/embed/' + $(this).data('video-id') + '?modestbranding=1';
      $(this).siblings('.uyoutube-main-video').find('iframe').attr('src', videoUrl);
    });
  });
})(jQuery);
