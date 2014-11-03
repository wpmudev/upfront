/*global ugalleries */
jQuery(function($){

	var calculateMargins =  function(gallery, absolute) {
		var container = gallery.find('.ugallery_items').width(),
			items = gallery.find('.ugallery_labels').length ? gallery.find('.ugallery_item.filtered') : gallery.find('.ugallery_item'),
			itemWidth = items.outerWidth(),
			minMargin = 30,
			row = 0,
			columns = Math.floor(container / itemWidth),
			margin, totalMargin, remaining, grid_cell, no_padding
		;

		no_padding = gallery.data('no-padding');

		if (!no_padding && columns * itemWidth + (columns - 1 ) * minMargin > container) {
			columns--;
		}

		totalMargin = container - (columns * itemWidth);
		margin = no_padding ? 0 : Math.floor(totalMargin / columns);
		grid_cell = margin + itemWidth;
		remaining = container - (columns * itemWidth + margin * columns);

		items.each(function(item_index){
			var $this = $(this),
				extra,
				column;

			if(absolute) {
				column = item_index - (row * columns);
				extra = column < remaining ? column : 0;
				if(no_padding) {
					extra = 0;
				}

				$this.css('left', grid_cell * column + extra);

				if (item_index > 0 && (item_index + 1) % columns === 0) {
					row++;
				}
			} else {
				extra = columns - (item_index % columns) < remaining ? 1 : 0;
				if (no_padding) {
					extra = 0;
				}
				$this.css('margin-right', (item_index + 1) % columns ? margin + extra : 0);
			}
		});
	};

	var bindShuffle = function() {
		$('.ugallery_grid').each(function(){
			var grid = $(this),
				no_padding = grid.parent().data('no-padding');

			grid.on('layout.shuffle', function(){
				setTimeout(function(){
					calculateMargins(grid.parent(), true);
				}, 20);
			});

			grid.shuffle({
				itemSelector: '#' + $(this).attr('rel') + ' .ugallery_item',
				gutterWidth: function(containerWidth){
					var container = containerWidth,
						minGutter = no_padding ? 0 : 30,
						width = $(this.$items[0]).width(),
						columns = Math.floor(container / width),
						totalGutter,
						gutter;

					if (no_padding) {
						return 0;
					}

					if(columns * width + (columns - 1) * minGutter > container) {
						columns--;
					}

					totalGutter = container - columns * width;
					gutter = Math.floor(totalGutter / (columns - 1));

					return gutter - 2 * columns;
				},
				supported: false
			});

			grid.siblings('.ugallery_labels').on('click', '.ugallery_label_filter', function(e) {
				var filter;

				e.preventDefault();
				$(e.delegateTarget).find('a.filter_selected').removeClass('filter_selected');
				filter = $(e.target).addClass('filter_selected').attr('rel');
				grid.shuffle('shuffle', filter);
			});
		});
	};

	bindShuffle();

	$(document).on('upfront-load', function() {
		Upfront.frontFunctions = Upfront.frontFunctions || {};
		Upfront.frontFunctions.galleryBindShuffle = bindShuffle;

		Upfront.Events.on('upfront:layout:loaded', function() {
			setTimeout(function() {
				bindShuffle();
			}, 2500);
		});
	});

	if (typeof ugalleries !== 'undefined') {
		var titleSrc = function(item){
			var itemId = item.el.closest('.ugallery_item').attr('rel'),
				text = gallery.find('.ugallery_lb_text[rel=' + itemId + ']')
			;
			if (text.length) {
				return text.html();
			}
			return '';
		};

		var resizeWithText = function() {
			var caption = this.content.find('figcaption'),
				maxHeight = this.wH - 120 - caption.outerHeight(),
				maxWidth = $(window).width() - 200
			;

			this.content.find('img').css({
				'max-width': maxWidth,
				'max-height': maxHeight
			});
		};
		var gallery, magOptions;
		for (var galleryId in ugalleries) {
			gallery = false;
			magOptions = ugalleries[galleryId].magnific;
			if (magOptions){
				gallery = $('#' + galleryId).find('.ugallery_item');
				if (ugalleries[galleryId].useLightbox) {
					magOptions.image = {
						titleSrc: titleSrc
					};
				}

				magOptions.callbacks = {resize: resizeWithText, afterChange: resizeWithText};
				gallery.magnificPopup(magOptions);
			} else {
				gallery = $('#' + galleryId).find('.ugallery_lightbox_link');
				magOptions = {
					type: 'image',
					gallery: {
						enabled: 'true',
						tCounter: '<span class="mfp-counter">%curr% / %total%</span>'
					},
					titleSrc: 'title',
					verticalFit: true,
					image: {
						markup: ugalleries[galleryId].template.markup,
						titleSrc: 'title',
						verticalFit: true
					},
					callbacks: {resize: resizeWithText, afterChange: resizeWithText}
				};
				gallery.magnificPopup(magOptions);
			}
		}

		setTimeout(function(){
			$(window).trigger('resize');
		}, 300);
	}

	$(window).on('resize', function(){
		$('.ugallery').each(function(){
			var gallery = $(this);
			if(!gallery.children('.ugallery_grid').length) {
				calculateMargins(gallery, false);
			}
		});
	});
});
