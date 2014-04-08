jQuery(function($){

	var calculateMargins =  function(gallery, absolute) {
		var container = gallery.find('.ugallery_items').width(),
			items = gallery.find('.ugallery_item'),
			itemWidth = items.outerWidth(),
			minMargin = 30,
			columns = Math.floor(container / itemWidth),
			margin, totalMargin, remaining, grid
		;

		if(columns * itemWidth + (columns - 1 ) * minMargin > container)
			columns--;

		totalMargin = container - (columns * itemWidth);
		margin = Math.floor(totalMargin / (columns-1));
		grid = margin + itemWidth;
		remaining = container - (columns * itemWidth + margin * (columns-1));

		items.each(function(idx){
			var $this = $(this),
				extra
			;
			if(absolute){
				var left = $this.position().left,
					col = Math.round(left / grid)
				;
				extra = col < remaining ? col : 0;
				$this.css('left', col*grid + extra);
			}
			else{
				extra = columns - (idx % columns) < remaining ? 1 : 0;
				$this.css('margin-right', (idx + 1) % columns ? margin + extra : 0);
			}
		});
	};

	$('.ugallery_grid').each(function(){
		var grid = $(this);

		grid.on('layout.shuffle', function(){
			setTimeout(function(){
				calculateMargins(grid.parent(), true);
			}, 20);
		});

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
			},
			supported: false
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

		var resizeWithText = function() {
			console.log('Resizing!!');
			var caption = this.content.find('figcaption'),
				maxHeight = this.wH - 120 - caption.outerHeight(),
				maxWidth = $(window).width() - 200
			;

			this.content.find('img').css({
				'max-width': maxWidth,
				'max-height': maxHeight
			});
		};

		for(var galleryId in ugalleries){
			var gallery = $('#' + galleryId).find('.ugallery_item'),
				magOptions = ugalleries[galleryId].magnific
			;

			if(gallery.find('.ugallery_lb_texts').length)
				magOptions.image = {
					titleSrc: titleSrc
				};

			magOptions.callbacks = {resize: resizeWithText, afterChange: resizeWithText};
			gallery.magnificPopup(magOptions);
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
