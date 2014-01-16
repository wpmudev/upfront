jQuery(function($){

	var calculateMargins =  function(gallery) {
		var container = gallery.find('.ugallery_items').width(),
			items = gallery.find('.ugallery_item'),
			itemWidth = items.outerWidth(),
			minMargin = 30,
			columns = Math.floor(container / itemWidth)
		;

		if(columns * itemWidth + (columns - 1 ) * minMargin > container)
			columns--;

		var margin = Math.floor( (container - (columns * itemWidth)) / (columns - 1) ) - 2 * columns;

		items.each(function(idx){
			$(this).css('margin-right', (idx + 1) % columns ? margin : 0);
		});
	};

	$('.ugallery_grid').each(function(){
		var grid = $(this);
		grid.shuffle({
			itemSelector: '#' + $(this).attr('rel') + ' .ugallery_item',
			gutterWidth: function(containerWidth){
				var container = containerWidth,
					minGutter = 30,
					width = $(this.$items[0]).width(),
					columns = Math.floor(container / width)
				;
				if(columns * width + (columns - 1) * minGutter > container)
					columns--;

				var totalGutter = container - columns * width,
					gutter = Math.floor(totalGutter / (columns - 1))
				;

				return gutter - 2 * columns;
			}
		});

		grid.siblings('.ugallery_labels').on('click', '.ugallery_label_filter', function(e){
			e.preventDefault();
			$(e.delegateTarget).find('a.filter_selected').removeClass('filter_selected');
			var filter = $(e.target).addClass('filter_selected').attr('rel');
			grid.shuffle('shuffle', filter);
		});
	});


	if(typeof ugalleries != 'undefined'){
		var titleSrc = function(item){
			var itemId = item.el.closest('.ugallery_item').attr('rel'),
				text = gallery.find('.ugallery_lb_text[rel=' + itemId + ']')
			;
			if(text.length)
				return text.html();
			return '';
		};

		for(var galleryId in ugalleries){
			var gallery = $('#' + galleryId).find('.ugallery_item');

			if(gallery.find('.ugallery_lb_texts').length)
				ugalleries[galleryId].magnific.image = {
					titleSrc: titleSrc
				};

			gallery.magnificPopup(ugalleries[galleryId].magnific);
		}

		setTimeout(function(){
			$(window).trigger('resize');
		}, 300);
	}

	$(window).on('resize', function(){
		$('.ugallery').each(function(){
			var gallery = $(this);
			if(!gallery.children('.ugallery_grid').length)
				calculateMargins(gallery);
		});
	})
});