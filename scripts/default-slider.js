(function( $ ) {
	$.fn.upfront_default_slider = function (args) {
		var data = {
				auto: true,
				interval: 5000, // in ms
				auto_height: true, // true | false
				control: 'outside', // outside | inside
				control_num: true,
				control_next_prev: true,
				show_control: 'always', //  always | hover
				effect: 'crossfade', // crossfade | slide-down | slide-up | slide-left | slide-right
				classname: {
					slider: 'upfront-default-slider',
					slider_wrap: 'upfront-default-slider-wrap',
					item: 'upfront-default-slider-item',
					nav: 'upfront-default-slider-nav',
					nav_item: 'upfront-default-slider-nav-item',
					prev: 'upfront-default-slider-nav-prev',
					next: 'upfront-default-slider-nav-next'
				},
				adjust_slide_size: true,
				starting_slide: 0
			},
			me = this;
		$.extend(data, args);
		this.each(function(){
			var $slider = $(this),
				$items = data.item ? $slider.find('>'+data.item) : $slider.find('>.'+data.classname.item),
				$slider_wrap = $('<div class="' + data.classname.slider_wrap + '" />'), 
				$nav = $('<div class="' + data.classname.nav + '" />'), 
				$prev = $('<div class="' + data.classname.prev + '" />'), 
				$next = $('<div class="' + data.classname.next + '" />'),
				max_height = 0,
				slider_index = 0,
				slider_pause = false,
				slider_auto, slider_interval, slider_effect, slider_control, slider_show_control, slider_t;
			if ( $slider.data('slider-applied') )
				return;
			$slider.data('slider-applied', true);
			$slider.addClass(data.classname.slider);
			$slider.append($slider_wrap);
			
			// Config
			update_configs();
			function update_configs () {
				$slider.removeClass(data.classname.slider + '-control-' + slider_control);
				$slider.removeClass(data.classname.slider + '-control-' + slider_show_control);
				slider_auto = $slider.attr('data-slider-auto');
				if ( typeof slider_auto != 'string' )
					slider_auto = data.auto;
				else
					slider_auto = slider_auto == '0' ? false : true;
				slider_interval = $slider.attr('data-slider-interval') || data.interval;
				slider_effect = $slider.attr('data-slider-effect') || data.effect;
				slider_control = $slider.attr('data-slider-control') || data.control;
				slider_show_control = $slider.attr('data-slider-show-control') || data.show_control;
				$slider.addClass(data.classname.slider + '-control-' + slider_control);
				$slider.addClass(data.classname.slider + '-control-' + slider_show_control);
			}
			
			// Add items
			update_items($items);
			function update_items($new_items){
				$items = $new_items;
				$slider_wrap.html('');
				$slider_wrap.append($items);
				$items.addClass(data.classname.item);
				if ( data.auto_height ){ // Auto height adjustment to the highest slide
					calc_height();
					$slider.find('img').one('load', calc_height);
				}
				else if(data.adjust_slide_size){ // Adjust slides to available space
					adjust_slide_size();
				}
			}
			
			function calc_height () {
				$slider.css('height', 9999);
				$items.each(function(index){
					var $img = $(this).find('img'),
						img_h = $img.height();
					max_height = max_height > img_h ? max_height : img_h;
				});
				$slider.css('height', Math.ceil(max_height/15)*15);
			}
			
			function adjust_slide_size () {
				var height = $slider.outerHeight(),
					width = $slider.outerWidth();
				$items.each(function(){
					var $img = $(this).find('img'),
						img_h = $img.height(),
						img_w = $img.width();
					if ( height/width > img_h/img_w )
						$img.css({ height: '100%', width: 'auto' });
					else
						$img.css({ height: 'auto', width: '100%' });
				});
			}
			
			if ( !data.auto_height && data.adjust_slide_size){
				$(window).on('load', adjust_slide_size);
				$(window).on('resize', adjust_slide_size);
			}
					
			// Add navigation
			update_nav();
			$slider.append($nav);
			function update_nav () {
				$nav.html('');
				if ( data.control_num ){
					$items.each(function(index){
						$nav.append('<i class="' + data.classname.nav_item + '" data-slider-index="' + index + '">'+index+'</i>');
					});
					$slider.on('click', '.'+data.classname.nav_item, function(e){
						e.preventDefault();
						var index = $(this).data('slider-index');
						slider_switch(index);
						slider_pause = true;
					});
				}
			}
			
			// Next and previous navigation
			if ( data.control_next_prev ){
				$slider.append($prev);
				$slider.on('click', '.'+data.classname.prev, function(e){
					e.preventDefault();
					var fx = ( slider_effect == 'slide-left' || slider_effect == 'slide-right') ? 'slide-right' : ( slider_effect == 'crossfade' ? 'crossfade' : 'slide-down' );
					slider_switch(slider_index > 0 ? slider_index-1 : $items.length-1, false, fx);
					slider_pause = true;
				});
				$slider.append($next);
				$slider.on('click', '.'+data.classname.next, function(e){
					e.preventDefault();
					var fx = ( slider_effect == 'slide-left' || slider_effect == 'slide-right') ? 'slide-left' : ( slider_effect == 'crossfade' ? 'crossfade' : 'slide-up' );
					slider_switch(slider_index+1 >= $items.length ? 0 : slider_index+1, false, fx);
					slider_pause = true;
				});
			}
			function slider_switch (index, is_auto, effect) {
				var $n = $nav.find('.'+data.classname.nav_item).eq(index),
					$item = $items.eq(index),
					effect = effect ? effect : slider_effect,
					current = $slider.find('.'+data.classname.item+'-current')
				;
				if ( !$item.hasClass(data.classname.item+'-current') && !(is_auto && slider_pause) ){
					$slider.trigger('slideout', current);
					current.removeClass(data.classname.item+'-current');
					$item.addClass(data.classname.item+'-current');
					$nav.find('.'+data.classname.nav_item+'-selected').removeClass(data.classname.nav_item+'-selected');
					$n.addClass(data.classname.nav_item+'-selected');
					slider_index = index;
					// Animation effect
					$item.addClass(data.classname.item+'-effect-'+effect);
					$item.one('animationend webkitAnimationEnd MSAnimationEnd oAnimationEnd webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function () {
						$(this).removeClass(data.classname.item+'-effect-'+effect);
						if($item.hasClass(data.classname.item+'-current'))
							$slider.trigger('slidein', [$item, index]);
					});
				}
				slider_pause = false;
			}
			slider_switch(data.starting_slide);
			
			update_auto_slide();
			function update_auto_slide () {
				if ( slider_t )
					clearInterval(slider_t);
				if ( slider_auto && slider_interval > 999 ){
					slider_t = setInterval(function(){
						slider_switch( slider_index+1 >= $items.length ? 0 : slider_index+1, true );
					}, slider_interval);
				}
			}
			
			// Refresh this slider
			me.on('refresh', function(){
				var $new_items = data.item ? $slider.find('>'+data.item) : $slider.find('>.'+data.classname.item),
					new_length = $new_items.length,
					length = $items.length;
				update_configs();
				update_auto_slide();
				if ( new_length ){
					update_items($new_items);
					update_nav();
					if ( new_length != length )
						slider_switch(0);
				}
				if ( !data.auto_height &&  data.adjust_slide_size){
					adjust_slide_size();
					$items.find('img').one('load', adjust_slide_size);
				}
			});
			
			// Pause slider
			me.on('pause', function(){
				clearInterval(slider_t);
			});
			
			// Resume
			me.on('resume', function(){
				update_auto_slide();
			});
		});
	};
	
	
	$(document).ready(function(){
		
		// Inline post slider setup
		var inline_slider = {
			item: '.upfront-inserted_image-wrapper',
			control_next_prev: false
		}
		$('.upfront-inline_post-slider').upfront_default_slider(inline_slider);
		
		// Bg slider
		var bg_slider = {
			auto_height: false,
			control: 'inside'
		}
		$('.upfront-bg-slider').upfront_default_slider(bg_slider);
		
		// Integration with Upfront editor
		$(document).on('upfront-load', function(){
			Upfront.Events.on('application:mode:after_switch', function(){
				$('.upfront-inline_post-slider').upfront_default_slider(inline_slider);
			});
			Upfront.Events.on('entity:background:update', function(view, model){
				var $s = view.$el.find('.upfront-region-bg-slider');
				if ( $s.length ){
					if ( $s.data('slider-applied') )
						$s.trigger('refresh');
					else
						$s.upfront_default_slider(bg_slider);
				}
			})/*,
			CKEDITOR.on('currentInstance', function(){
				editor = CKEDITOR.currentInstance;
				//$('.upfront-inline_post-slider').upfront_default_slider(inline_slider);
				if ( !editor )
					return;
				editor.on('insertHtml', function(){
				//	$('.upfront-inline_post-slider').upfront_default_slider(inline_slider);
				});
			}); */
		});
		
	});
 
}( jQuery ));