/*global ugalleries, Modernizr */
jQuery(function($){
	var throttle = function(a,b,c){var d,e,f,g=null,h=0;c||(c={});var i=function(){h=c.leading===!1?0:new Date().getTime(),g=null,f=a.apply(d,e),g||(d=e=null)};return function(){var j=new Date().getTime();h||c.leading!==!1||(h=j);var k=b-(j-h);return d=this,e=arguments,0>=k||k>b?(clearTimeout(g),g=null,h=j,f=a.apply(d,e),g||(d=e=null)):g||c.trailing===!1||(g=setTimeout(i,k)),f}};

	var resizedInDesktop = false;
	var initialized = false;

	var updateHorizonalPadding =  function(gallery, absolute) {
		var container = gallery.find('.ugallery_items').width(),
			items = gallery.find('.ugallery_labels').length ? gallery.find('.ugallery_item.filtered') : gallery.find('.ugallery_item'),
			itemWidth = items.outerWidth(),
			row = 0,
			columns,
			even_padding,
			thumbPaddingData,
			thumbPadding,
			itemsTotalWidth;

		even_padding = gallery.data('even-padding');
		thumbPaddingData = gallery.data('thumb-padding');
		thumbPadding = typeof thumbPaddingData === 'undefined' ? 15 : thumbPaddingData;
		columns = Math.floor(container / (itemWidth + thumbPadding));
		columns++;// Increase for 1 besause upper calculation will always give one less
		itemsTotalWidth = columns * itemWidth + (columns - 1) * thumbPadding;
		if (itemsTotalWidth > container) {// But check if got too much
			columns--;
		}

		items.each(function(item_index) {
			var $this = $(this);

			if (absolute) {
				// Set top margin for all thumbs that are not in first row
				if (item_index + 1 > columns && even_padding) {
					$this.css('top', parseInt($this.css('top'), 10) + thumbPadding * row);
				}

				if (item_index > 0 && (item_index + 1) % columns === 0) {
					row++;
					if (even_padding && !gallery.data('height-adjusted')) {
						gallery.css('height', parseInt(gallery.css('height'), 10) + thumbPadding);
					}
				}
			} else {
				// Set top margin for all thumbs that are not in first row
				if (item_index + 1 > columns && even_padding) {
					$this.css('margin-top', thumbPadding);
				}
			}
		});

		if (absolute && !gallery.data('height-adjusted')) {
			gallery.css('height', parseInt(gallery.css('height'), 10) - parseInt(items.css('margin-bottom'), 10));
		}

		gallery.data('height-adjusted', true);
	};

	var bindShuffle = function($ugallery_grid, force) {
		if (Modernizr.mq('only all and (max-width: 1079px)')) {
			return;
		}
		if (!force) {
			if (resizedInDesktop) {
				return;
			}
		}
		resizedInDesktop = true;

		var $grids = $ugallery_grid || $('.ugallery_grid');

		$grids.each(function(){
			var grid = $(this),
				thumbPaddingData = grid.parent().data('thumb-padding'),
				thumbPadding = typeof thumbPaddingData === 'undefined' ? 15 : thumbPaddingData;

			grid.parent().data('height-adjusted', false);

			grid.on('layout.shuffle', function(){
				setTimeout(function(){
					updateHorizonalPadding(grid.parent(), true);
				}, 20);
			});

			grid.shuffle({
				itemSelector: '#' + $(this).attr('rel') + ' .ugallery_item',
				gutterWidth: thumbPadding,
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

	$(document).on('upfront-load', function() {
		Upfront.frontFunctions = Upfront.frontFunctions || {};
		Upfront.frontFunctions.galleryBindShuffle = bindShuffle;
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

		/**
		 * re-Resize Magnific Popup 100ms after MFP open (iPhone issue) 
		 */
		var resizeMFP = function() {
			if(/i(Pad|Phone|Pod)/g.test(navigator.userAgent))
				setTimeout(function(){
					$.magnificPopup.instance.updateSize();
				}, 500);
		};

		var gallery, magOptions;
		for (var galleryId in ugalleries) {
			gallery = false;
			magOptions = ugalleries[galleryId].magnific;
			if (magOptions){
				gallery = $('#' + galleryId).find('.ugallery_item_image');
				$.each(gallery, function() {
					// Remove added linking to larger image - it breaks links in image description
					$(this).find('.ugallery_lb_text .ugallery_lightbox_link').removeAttr('href');
				});
				if (ugalleries[galleryId].useLightbox) {
					magOptions.image = {
						titleSrc: titleSrc
					};
				}

				magOptions.callbacks = {resize: resizeWithText, afterChange: resizeWithText, open: resizeMFP};
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
					callbacks: {resize: resizeWithText, afterChange: resizeWithText, open: resizeMFP}
				};
				gallery.magnificPopup(magOptions);
			}
		}

		setTimeout(function(){
			$(window).trigger('resize');
		}, 300);
	}

	var lazyBindShuffle = throttle(function(){
		if (initialized === false) {
			initialized = true;
			bindShuffle();
			return;
		}

		if (Modernizr.mq('only all and (max-width: 1079px)')) {
			return;
		}

		bindShuffle();
	}, 100);

	$(window).on('resize', lazyBindShuffle);
});
