jQuery(function($){

	$('.ugallery_grid').each(function(){
		var grid = $(this);
		grid.shuffle({
			itemSelector: '#' + $(this).attr('rel') + ' .ugallery_item',
			sizer: $(this).find('.ugallery_item').first().outerWidth(),
			gutterWidth: 30
		});

		grid.siblings('.ugallery_labels').on('click', '.ugallery_label_filter', function(e){
			e.preventDefault();
			$(e.delegateTarget).find('a.filter_selected').removeClass('filter_selected');
			var filter = $(e.target).addClass('filter_selected').attr('rel');
			grid.shuffle('shuffle', filter);
		});
	});


	if(typeof ugalleries != 'undefined'){
		for(var galleryId in ugalleries){
			var gallery = $('#' + galleryId).find('.ugallery_item');

			if(gallery.find('.ugallery_lb_texts').length)
				ugalleries[galleryId].magnific.image = {
					titleSrc: function(item){
						var itemId = item.el.closest('.ugallery_item').attr('rel'),
							text = gallery.find('.ugallery_lb_text[rel=' + itemId + ']')
						;
						if(text.length)
							return text.html();
						return '';
					}
				};

			gallery.magnificPopup(ugalleries[galleryId].magnific);
		}
	}
});