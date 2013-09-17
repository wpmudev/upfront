(function($){
	
	$('[type="text/responsive_css"]').each(function(){
		var r_id = 'responsive-'+(Math.floor(Math.random()*100000)),
			bind = $(this).attr('data-bind'),
			min_width = normalize_size($(this).attr('data-min-width')),
			max_width = normalize_size($(this).attr('data-max-width')),
			min_height = normalize_size($(this).attr('data-min-height')),
			max_height = normalize_size($(this).attr('data-max-height')),
			styles = $(this).html();
		$(window).on('load', apply_binding);
		$(window).on('resize', function(e){
			if ( e.target == this )
				apply_binding();
		});
		if ( typeof Upfront.Events != 'undefined' ){
			Upfront.Events.on("upfront:layout:loaded", function(){
				apply_binding();
				Upfront.Events.on("entity:module:after_render", apply_binding);
				Upfront.Events.on("entity:resize_stop", apply_binding);
				Upfront.Events.on("upfront:editor:image_on", function(sel){
					apply_binding();
				});
				Upfront.Events.on("upfront:editor:image_align", function(sel, align){
					apply_binding();
				});
			});
		}
		function apply_binding (sel) {
			//console.log('--- apply binding -' + r_id);
			var $sel = _.isString(sel) ? $(sel) : $('body');
			$sel.find(bind).each(function(){
				var id = $(this).attr('id') || 'bind-'+(Math.floor(Math.random()*100000)),
					width = $(this).outerWidth(),
					height = $(this).outerHeight(),
					selector = 'style[data-id="'+r_id+'-'+id+'"]',
					bind_styles = styles.replace(/\( ?this ?\)/igm, '#'+id);
				if ( ! $(this).attr('id') )
					$(this).attr('id', id);
				if ( $(selector).size() == 0 )
					$('body').append('<style data-id="'+r_id+'-'+id+'" />');
				var matched = (
					( (min_width && width >= min_width) || !min_width ) &&
					( (max_width && width <= max_width) || !max_width ) &&
					( (min_height && height >= min_height) || !min_height ) &&
					( (max_height && height <= max_height) || !max_height )
				);
				if ( matched && !$(selector).data('applied') )
					$(selector).data('applied', true).html(bind_styles);
				else if ( !matched )
					$(selector).data('applied', false).html('');
			});	
		}
		function normalize_size (size) {
			if ( typeof size == 'undefined' )
				return false;
			var px_regex = /^(\d+)px$/i,
				col_regex = /^(\d+)col$/i,
				row_regex = /^(\d+)row$/i;
			if ( size.match(px_regex) ) // px
				return size.match(px_regex)[1];
		}
	});
	
})(jQuery);
